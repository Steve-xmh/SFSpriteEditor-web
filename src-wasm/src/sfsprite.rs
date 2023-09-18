use crate::gbacolor::GBAColor;
use binrw::*;
use serde::*;
use std::{convert::TryFrom, fmt::Debug, io::SeekFrom};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct SFSpriteFileHeader {
    pub tile_number_shift: u32,
    pub tileset_header: SFSpriteTilesetHeader,
    pub palette_header: SFSpritePaletteHeader,
    pub animation_header: SFSpriteAnimationHeader,
    pub sprite_header: SFSpriteSpriteHeader,
}

impl BinRead for SFSpriteFileHeader {
    type Args<'a> = ();

    fn read_options<R: io::Read + io::Seek>(
        reader: &mut R,
        endian: Endian,
        _args: Self::Args<'_>,
    ) -> BinResult<Self> {
        let tileset_offset = u32::read_le(reader)?;
        let palette_offset = u32::read_le(reader)?;
        let animation_offset = u32::read_le(reader)?;
        let sprite_offset = u32::read_le(reader)?;
        let tile_number_shift = u32::read_le(reader)?;

        reader.seek(SeekFrom::Start(tileset_offset as _))?;
        let mut tileset_header = SFSpriteTilesetHeader::read_options(reader, endian, ())?;
        reader.seek(SeekFrom::Start(palette_offset as _))?;
        let palette_header = SFSpritePaletteHeader::read_options(reader, endian, ())?;
        reader.seek(SeekFrom::Start(animation_offset as _))?;
        let animation_header =
            SFSpriteAnimationHeader::read_options(reader, endian, (animation_offset,))?;
        reader.seek(SeekFrom::Start(sprite_offset as _))?;
        let sprite_header = SFSpriteSpriteHeader::read_options(reader, endian, (sprite_offset,))?;

        if palette_header.color_depth == ColorDepth::Depth4BPP {
            // Convert tileset data from 4bpp to 8bpp
            let mut new_tileset_data = Vec::with_capacity(tileset_header.tileset_data.len() * 2);
            for byte in &tileset_header.tileset_data {
                new_tileset_data.push(*byte & 0xF);
                new_tileset_data.push(*byte >> 4);
            }
            tileset_header.tileset_data = new_tileset_data;
        }

        Ok(Self {
            tile_number_shift,
            tileset_header,
            palette_header,
            animation_header,
            sprite_header,
        })
    }
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

        if self.palette_header.color_depth == ColorDepth::Depth4BPP {
            // Convert tileset data from 8bpp to 4bpp
            let mut new_tileset_data =
                Vec::with_capacity(self.tileset_header.tileset_data.len() / 2);
            for i in 0..self.tileset_header.tileset_data.len() / 2 {
                new_tileset_data.push(
                    self.tileset_header.tileset_data[i * 2]
                        | self.tileset_header.tileset_data[i * 2 + 1] << 4,
                );
            }
            SFSpriteTilesetHeader::write_options(
                &SFSpriteTilesetHeader {
                    tileset_data: new_tileset_data,
                    ..self.tileset_header.clone()
                },
                writer,
                endian,
                (),
            )?;
        } else {
            SFSpriteTilesetHeader::write_options(&self.tileset_header, writer, endian, ())?;
        }

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
#[derive(Default, Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum ColorDepth {
    #[brw(magic = 5u16)]
    #[default]
    Depth4BPP,
    #[brw(magic = 6u16)]
    Depth8BPP,
}

impl ColorDepth {
    pub fn tile_size(&self) -> usize {
        match self {
            ColorDepth::Depth4BPP => 8 * 8 / 2,
            ColorDepth::Depth8BPP => 8 * 8,
        }
    }

    pub fn tile_data_width(&self) -> usize {
        match self {
            ColorDepth::Depth4BPP => 4,
            ColorDepth::Depth8BPP => 8,
        }
    }
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

impl ObjectShape {
    pub fn tile_amount(&self) -> usize {
        match self {
            ObjectShape::Size8x8 => 1,
            ObjectShape::Size16x8 => 2,
            ObjectShape::Size8x16 => 2,
            ObjectShape::Size16x16 => 4,
            ObjectShape::Size32x8 => 4,
            ObjectShape::Size8x32 => 4,
            ObjectShape::Size32x32 => 16,
            ObjectShape::Size32x16 => 8,
            ObjectShape::Size16x32 => 8,
            ObjectShape::Size64x64 => 64,
            ObjectShape::Size64x32 => 32,
            ObjectShape::Size32x64 => 32,
        }
    }

    pub fn tile_width_amount(&self) -> usize {
        match self {
            ObjectShape::Size8x8 => 1,
            ObjectShape::Size16x8 => 2,
            ObjectShape::Size8x16 => 1,
            ObjectShape::Size16x16 => 2,
            ObjectShape::Size32x8 => 4,
            ObjectShape::Size8x32 => 1,
            ObjectShape::Size32x32 => 4,
            ObjectShape::Size32x16 => 4,
            ObjectShape::Size16x32 => 2,
            ObjectShape::Size64x64 => 8,
            ObjectShape::Size64x32 => 8,
            ObjectShape::Size32x64 => 4,
        }
    }

    pub fn tile_height_amount(&self) -> usize {
        match self {
            ObjectShape::Size8x8 => 1,
            ObjectShape::Size16x8 => 1,
            ObjectShape::Size8x16 => 2,
            ObjectShape::Size16x16 => 2,
            ObjectShape::Size32x8 => 1,
            ObjectShape::Size8x32 => 4,
            ObjectShape::Size32x32 => 4,
            ObjectShape::Size32x16 => 2,
            ObjectShape::Size16x32 => 4,
            ObjectShape::Size64x64 => 8,
            ObjectShape::Size64x32 => 4,
            ObjectShape::Size32x64 => 8,
        }
    }

    pub fn width(&self) -> usize {
        match self {
            ObjectShape::Size8x8 => 8,
            ObjectShape::Size16x8 => 16,
            ObjectShape::Size8x16 => 8,
            ObjectShape::Size16x16 => 16,
            ObjectShape::Size32x8 => 32,
            ObjectShape::Size8x32 => 8,
            ObjectShape::Size32x32 => 32,
            ObjectShape::Size32x16 => 32,
            ObjectShape::Size16x32 => 16,
            ObjectShape::Size64x64 => 64,
            ObjectShape::Size64x32 => 64,
            ObjectShape::Size32x64 => 32,
        }
    }

    pub fn height(&self) -> usize {
        match self {
            ObjectShape::Size8x8 => 8,
            ObjectShape::Size16x8 => 8,
            ObjectShape::Size8x16 => 16,
            ObjectShape::Size16x16 => 16,
            ObjectShape::Size32x8 => 8,
            ObjectShape::Size8x32 => 32,
            ObjectShape::Size32x32 => 32,
            ObjectShape::Size32x16 => 16,
            ObjectShape::Size16x32 => 32,
            ObjectShape::Size64x64 => 64,
            ObjectShape::Size64x32 => 32,
            ObjectShape::Size32x64 => 64,
        }
    }
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
    Both = 0x03,
}

impl FilpFlag {
    pub fn is_horizontal(&self) -> bool {
        matches!(self, FilpFlag::Horizontal | FilpFlag::Both)
    }

    pub fn is_vertical(&self) -> bool {
        matches!(self, FilpFlag::Vertical | FilpFlag::Both)
    }
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
