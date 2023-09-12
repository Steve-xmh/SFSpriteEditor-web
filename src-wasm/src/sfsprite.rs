use binrw::*;
use std::{convert::TryFrom, fmt::Debug, io::SeekFrom};
use serde::*;
use crate::gbacolor::GBAColor;

#[binread]
#[br(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteFileHeader {
    #[br(temp)]
    tileset_offset: u32,
    #[br(temp)]
    palette_offset: u32,
    #[br(temp)]
    animation_offset: u32,
    #[br(temp)]
    sprite_offset: u32,
    pub tile_number_shift: u32,
    #[br(seek_before = SeekFrom::Start(tileset_offset as u64))]
    pub tileset_header: SFSpriteTilesetHeader,
    #[br(seek_before = SeekFrom::Start(palette_offset as u64))]
    pub palette_header: SFSpritePaletteHeader,
    #[br(seek_before = SeekFrom::Start(animation_offset as u64), args(animation_offset,))]
    pub animation_header: SFSpriteAnimationHeader,
    #[br(seek_before = SeekFrom::Start(sprite_offset as u64), args(sprite_offset,))]
    pub sprite_header: SFSpriteSpriteHeader,
}

impl BinWrite for SFSpriteFileHeader {
    type Args<'a> = ();

    fn write_options<W: io::Write + io::Seek>(
        &self,
        writer: &mut W,
        endian: Endian,
        _args: Self::Args<'_>,
    ) -> BinResult<()> {
        let header_pos = writer.stream_position()?;
        writer.seek(SeekFrom::Current(4 * 4))?;
        writer.write_le(&self.tile_number_shift)?;

        let tileset_offset = writer.stream_position()? as u32;
        SFSpriteTilesetHeader::write_options(&self.tileset_header, writer, endian, ())?;
        let palette_offset = writer.stream_position()? as u32;
        SFSpritePaletteHeader::write_options(&self.palette_header, writer, endian, ())?;
        let animation_offset = writer.stream_position()? as u32;
        SFSpriteAnimationHeader::write_options(&self.animation_header, writer, endian, ())?;
        let sprite_offset = writer.stream_position()? as u32;
        SFSpriteSpriteHeader::write_options(&self.sprite_header, writer, endian, ())?;
        let end_pos = writer.stream_position()?;

        writer.seek(SeekFrom::Start(header_pos))?;
        writer.write_le(&tileset_offset)?;
        writer.write_le(&palette_offset)?;
        writer.write_le(&animation_offset)?;
        writer.write_le(&sprite_offset)?;
        writer.seek(SeekFrom::Start(end_pos))?;

        Ok(())
    }
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteTilesetHeader {
    pub max_tiles: u16,
    #[bw(calc((tileset_data.len() / 0x20) as _))]
    total_tiles: u16,
    #[bw(calc(tileset_entries.len() as u16 * 4 + 8))]
    header_size: u16,
    #[brw(pad_before = 2)]
    #[br(count((header_size - 8) / 4))]
    pub tileset_entries: Vec<SFSpriteTilesetEntry>,
    #[br(count(total_tiles * 0x20))]
    pub tileset_data: Vec<u8>,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteTilesetEntry {
    pub amount: u16,
    pub offset: u16,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ColorDepth {
    #[brw(magic = 5u16)]
    #[default]
    Depth4BPP,
    #[brw(magic = 6u16)]
    Depth8BPP,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpritePaletteHeader {
    pub color_depth: ColorDepth,
    #[bw(calc(palettes.len() as u16))]
    pub max_palettes: u16,
    #[br(count(match color_depth {
        ColorDepth::Depth4BPP => max_palettes,
        ColorDepth::Depth8BPP => 16 * max_palettes,
    }))]
    pub palettes: Vec<[GBAColor; 16]>,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[br(import(animation_offset: u32))]
pub struct SFSpriteAnimationHeader {
    #[bw(calc = animations.len() as u16)]
    amount: u16,
    #[brw(pad_before = 2)]
    #[br(count = amount, args { inner: (animation_offset, ) })]
    #[bw(write_with = write_animations)]
    pub animations: Vec<SFSpriteAnimationEntry>,
}

#[writer(writer, endian)]
fn write_animations(animations: &Vec<SFSpriteAnimationEntry>) -> BinResult<()> {
    let animations_start = writer.stream_position()?;
    let animation_frames_start = animations_start + animations.len() as u64 * 4;
    let mut frame_start_pos = animation_frames_start;
    for (i, animation) in animations.iter().enumerate() {
        writer.seek(SeekFrom::Start(animations_start + i as u64 * 4))?;
        writer.write_le(&((frame_start_pos - animations_start) as u32 + 4))?;
        writer.seek(SeekFrom::Start(frame_start_pos))?;
        animation.write_options(writer, endian, ())?;
        frame_start_pos = writer.stream_position()?;
    }
    writer.seek(SeekFrom::Start(frame_start_pos))?;
    Ok(())
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[br(import(animation_offset: u32))]
pub struct SFSpriteAnimationEntry {
    #[br(parse_with = parse_animations, args(animation_offset, ) )]
    pub frames: Vec<SFSpriteAnimationFrame>,
}

#[parser(reader)]
fn parse_animations(animation_offset: u32) -> BinResult<Vec<SFSpriteAnimationFrame>> {
    let cur_pos = reader.stream_position()?;
    let pos = u32::read_le(reader)?;
    reader.seek(SeekFrom::Start((animation_offset + pos) as _))?;

    let mut frames = vec![];

    loop {
        let frame = SFSpriteAnimationFrame::read(reader)?;
        if frame.loop_flag != LoopFlag::None {
            frames.push(frame);
            break;
        } else {
            frames.push(frame);
        }
    }

    reader.seek(SeekFrom::Start(cur_pos + 4))?;
    Ok(frames)
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
#[brw(repr = u8)]
pub enum LoopFlag {
    #[default]
    None = 0,
    End = 0x40,
    Loop = 0x80,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteAnimationFrame {
    pub sprite_id: u8,
    pub delay: u8,
    pub loop_flag: LoopFlag,
    pub palette_id: u8,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[br(import(sprite_offset: u32))]
pub struct SFSpriteSpriteHeader {
    #[bw(calc = sprites.len() as u16)]
    amount: u16,
    #[brw(pad_before = 2)]
    #[br(count = amount, args { inner: (sprite_offset, ) })]
    #[bw(write_with = write_sprites)]
    pub sprites: Vec<SFSpriteSpriteEntry>,
}

#[writer(writer, endian)]
fn write_sprites(sprites: &Vec<SFSpriteSpriteEntry>) -> BinResult<()> {
    let sprites_start = writer.stream_position()?;
    let sprite_obj_start = sprites_start + sprites.len() as u64 * 4;
    let mut frame_start_pos = sprite_obj_start;
    for (i, sprite) in sprites.iter().enumerate() {
        writer.seek(SeekFrom::Start(sprites_start + i as u64 * 4))?;
        writer.write_le(&((frame_start_pos - sprites_start) as u32 + 4))?;
        writer.seek(SeekFrom::Start(frame_start_pos))?;
        sprite.write_options(writer, endian, ())?;
        frame_start_pos = writer.stream_position()?;
    }
    writer.seek(SeekFrom::Start(frame_start_pos))?;

    Ok(())
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[br(import(sprite_offset: u32))]
pub struct SFSpriteSpriteEntry {
    #[br(parse_with = parse_sprites, args(sprite_offset, ) )]
    pub objects: Vec<SFSpriteSpriteObject>,
}

// #[binrw]
// #[brw(little)]
// #[derive(Default, Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
// #[brw(repr = u8)]
// pub enum ObjectShape {
//     #[default]
//     Square,
//     Horizontal,
//     Vertical,
//     Prohibited,
// }

#[binrw]
#[brw(little)]
#[derive(Default, Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
#[brw(repr = u16)]
#[repr(u16)]
pub enum ObjectShape {
    #[default]
    Size8x8 = 0x0000u16,
    Size16x8 = 0x0100,
    Size8x16 = 0x0200,
    Size16x16 = 0x0001,
    Size32x8 = 0x0101,
    Size8x32 = 0x0201,
    Size32x32 = 0x0002,
    Size32x16 = 0x0102,
    Size16x32 = 0x0202,
    Size64x64 = 0x0003,
    Size64x32 = 0x0103,
    Size32x64 = 0x0203,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
#[brw(repr = u8)]
#[repr(u8)]
pub enum FilpFlag {
    #[default]
    None = 0x00u8,
    Horizontal = 0x01,
    Vertical = 0x02,
}

#[binrw]
#[brw(little)]
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteSpriteObject {
    pub tile_index_lower: u8,
    pub x: i8,
    pub y: i8,
    pub shape: ObjectShape,
    pub flip_flag: FilpFlag,
    pub is_last: u8,
    pub tile_index_upper: u8,
}

#[parser(reader)]
fn parse_sprites(sprite_offset: u32) -> BinResult<Vec<SFSpriteSpriteObject>> {
    let cur_pos = reader.stream_position()?;
    let pos = u32::read_le(reader)?;
    reader.seek(SeekFrom::Start((sprite_offset + pos) as _))?;

    let mut frames = vec![];

    loop {
        let frame = SFSpriteSpriteObject::read(reader)?;
        if frame.is_last != 0 {
            frames.push(frame);
            break;
        } else {
            frames.push(frame);
        }
    }

    reader.seek(SeekFrom::Start(cur_pos + 4))?;
    Ok(frames)
}
