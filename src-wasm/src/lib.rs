pub mod font;
pub mod gbacolor;
pub mod sfsprite;

use binrw::prelude::*;
use gbacolor::GBAColor;
use sfsprite::*;
use tracing::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default, Debug, Clone)]
pub struct SFSpriteEditor {
    data: SFSpriteFileHeader,
    redo_stack: Vec<SFSpriteFileHeader>,
    redo_index: usize,
}

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();
    tracing_wasm::set_as_global_default();
}

#[wasm_bindgen]
pub struct HittestResult {
    pub tile_id: usize,
    pub pixel_index: usize,
    pub sprite_obj_id: usize,
}

impl SFSpriteEditor {
    #[instrument]
    pub fn from_data(data: &[u8]) -> BinResult<SFSpriteEditor> {
        let mut obj = SFSpriteEditor::default();
        obj.load_from_data(data)?;
        Ok(obj)
    }

    #[instrument]
    pub fn load_from_data(&mut self, buffer: &[u8]) -> BinResult<()> {
        let mut cursor = std::io::Cursor::new(buffer);
        self.data = SFSpriteFileHeader::read_le(&mut cursor)?;
        self.redo_stack = vec![self.data.clone()];
        self.redo_index = 0;
        info!("已加载 SFSprite 文件");
        info!(
            "图块数据大小 {}",
            self.data.tileset_header.tileset_data.len()
        );
        Ok(())
    }

    #[instrument]
    pub fn export_to_buffer(&self) -> BinResult<Vec<u8>> {
        let mut buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buffer);
        self.data.write_le(&mut cursor)?;
        Ok(buffer)
    }

    #[instrument(skip(draw))]
    pub fn render_tile(
        &self,
        index: usize,
        palette_id: usize,
        mut draw: impl FnMut(usize, usize, GBAColor, usize),
    ) {
        let palette = &self.data.palette_header.palettes[palette_id];
        self.data.tileset_header.tileset_data[index * 64..(index + 1) * 64]
            .iter()
            .enumerate()
            .for_each(|(i, byte)| {
                let x = i % 8;
                let y = i / 8;
                let color_index = *byte as usize;
                if let Some(color) = palette.get(color_index) {
                    draw(x, y, *color, color_index);
                }
            });
    }

    #[instrument(skip(draw))]
    pub fn render_sprite(
        &self,
        index: usize,
        palette_id: usize,
        transparent: bool,
        mut draw: impl FnMut(isize, isize, GBAColor, usize),
    ) {
        info!("使用 {palette_id} 号调色板渲染 {index} 号精灵");
        if index >= self.data.sprite_header.sprites.len() {
            return;
        }
        if palette_id >= self.data.palette_header.palettes.len() {
            return;
        }
        let sprite = &self.data.sprite_header.sprites[index];
        let tile_size = 8 * 8;
        let tileset_entry = &self.data.tileset_header.tileset_entries[index];
        let tileset_data = &self.data.tileset_header.tileset_data[(tileset_entry.offset as usize)
            * tile_size
            ..((tileset_entry.offset + tileset_entry.amount) as usize) * tile_size];

        for obj in &sprite.objects {
            let tile_index = ((obj.tile_index_upper as usize) << 8 | obj.tile_index_lower as usize)
                << self.data.tile_number_shift as usize;
            let size_x = obj.shape.tile_width_amount();
            let size_y = obj.shape.tile_height_amount();
            for ty in 0..size_y {
                for tx in 0..size_x {
                    let tile_num = tile_index
                        + match obj.flip_flag {
                            FilpFlag::None => ty * size_x + tx,
                            FilpFlag::Horizontal => size_x * (size_y - ty - 1) + tx,
                            FilpFlag::Vertical => ty * size_x + (size_x - tx - 1),
                            FilpFlag::Both => size_x * (size_y - ty - 1) + (size_x - tx - 1),
                        };
                    let tile_data = &tileset_data[tile_num * tile_size..(tile_num + 1) * tile_size];
                    for (py, line) in tile_data.chunks_exact(8).enumerate() {
                        for (px, data) in line.iter().enumerate() {
                            let color_index = *data as usize;
                            if let Some(color) =
                                self.data.palette_header.palettes[palette_id].get(color_index)
                            {
                                if color_index != 0 || !transparent {
                                    draw(
                                        obj.x as isize + tx as isize * 8 + px as isize,
                                        obj.y as isize + ty as isize * 8 + py as isize,
                                        *color,
                                        color_index,
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    #[instrument]
    pub fn hittest(
        &self,
        sprite_id: usize,
        hit_x: isize,
        hit_y: isize,
        transparent: bool,
    ) -> Option<HittestResult> {
        if sprite_id >= self.data.sprite_header.sprites.len() {
            return None;
        }
        let sprite = &self.data.sprite_header.sprites[sprite_id];
        let tile_size = 8 * 8;
        let tileset_entry = &self.data.tileset_header.tileset_entries[sprite_id];
        let tileset_data = &self.data.tileset_header.tileset_data[(tileset_entry.offset as usize)
            * tile_size
            ..((tileset_entry.offset + tileset_entry.amount) as usize) * tile_size];

        for (sprite_obj_id, obj) in sprite.objects.iter().enumerate().rev() {
            let x = obj.x as isize;
            let y = obj.y as isize;
            let w = obj.shape.width() as isize;
            let h = obj.shape.height() as isize;
            if hit_x < x || hit_x >= x + w || hit_y < y || hit_y >= y + h {
                continue;
            }
            let size_x = obj.shape.tile_width_amount() as isize;
            let size_y = obj.shape.tile_height_amount() as isize;
            let pixel_x = hit_x - x;
            let pixel_y = hit_y - y;
            let tile_x = pixel_x / 8;
            let tile_y = pixel_y / 8;
            let start_tile = ((obj.tile_index_upper as isize) << 8 | obj.tile_index_lower as isize)
                << self.data.tile_number_shift as usize;
            let tile_num = start_tile
                + match obj.flip_flag {
                    FilpFlag::None => tile_y * size_x + tile_x,
                    FilpFlag::Horizontal => size_x * (size_y - tile_y - 1) + tile_x,
                    FilpFlag::Vertical => tile_y * size_x + (size_x - tile_x - 1),
                    FilpFlag::Both => size_x * (size_y - tile_y - 1) + (size_x - tile_x - 1),
                };
            let tile_data =
                &tileset_data[(tile_num as usize) * tile_size..(tile_num as usize + 1) * tile_size];
            let pixel_x = pixel_x % 8;
            let pixel_y = pixel_y % 8;
            let pixel_index = match obj.flip_flag {
                FilpFlag::None => pixel_y * 8 + pixel_x,
                FilpFlag::Horizontal => pixel_y * 8 + (7 - pixel_x),
                FilpFlag::Vertical => (7 - pixel_y) * 8 + pixel_x,
                FilpFlag::Both => (7 - pixel_y) * 8 + (7 - pixel_x),
            };
            let color_index = tile_data[pixel_index as usize] as usize;
            if color_index == 0 && transparent {
                continue;
            } else {
                return Some(HittestResult {
                    tile_id: tile_num as usize,
                    pixel_index: pixel_index as usize,
                    sprite_obj_id,
                });
            }
        }
        None
    }

    pub fn set_pixel_by_index(&mut self, tile_id: usize, pixel_index: usize, color_index: usize) {
        let tile_size = 8 * 8;
        let tile_data = &mut self.data.tileset_header.tileset_data
            [tile_id * tile_size..(tile_id + 1) * tile_size];
        tile_data[pixel_index] = color_index as u8;
    }

    pub fn record(&mut self) {
        self.redo_stack.truncate(self.redo_index);
        self.redo_stack.push(self.data.clone());
        self.redo_index += 1;
    }

    pub fn undo(&mut self) {
        if self.redo_index > 0 {
            self.redo_index -= 1;
            self.data = self.redo_stack[self.redo_index].clone();
        }
    }

    pub fn redo(&mut self) {
        if self.redo_index < self.redo_stack.len() {
            self.redo_index += 1;
            self.data = self.redo_stack[self.redo_index - 1].clone();
        }
    }
}

#[wasm_bindgen]
impl SFSpriteEditor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SFSpriteEditor {
        SFSpriteEditor::default()
    }

    #[wasm_bindgen(js_name = "fromData")]
    pub fn from_data_js(data: &[u8]) -> Result<SFSpriteEditor, String> {
        match Self::from_data(data) {
            Ok(data) => Ok(data),
            Err(err) => Err(format!("{:?}", err)),
        }
    }

    #[wasm_bindgen(js_name = "loadFromData")]
    pub fn load_from_data_js(&mut self, data: &[u8]) -> Result<(), String> {
        match self.load_from_data(data) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("{:?}", err)),
        }
    }

    #[wasm_bindgen(js_name = "exportToBuffer")]
    pub fn export_to_buffer_js(&self) -> Result<Vec<u8>, String> {
        match self.export_to_buffer() {
            Ok(data) => Ok(data),
            Err(err) => Err(format!("{:?}", err)),
        }
    }

    #[wasm_bindgen(js_name = "toJS")]
    pub fn to_js(&self) -> Result<JsValue, serde_wasm_bindgen::Error> {
        serde_wasm_bindgen::to_value(&self.data)
    }

    #[wasm_bindgen(js_name = "renderTile")]
    pub fn render_tile_js(&self, index: usize, palette_id: usize, draw: js_sys::Function) {
        self.render_tile(index, palette_id, |x, y, c, ci| {
            let arr = js_sys::Array::new();
            arr.push(&JsValue::from(x));
            arr.push(&JsValue::from(y));
            arr.push(&JsValue::from(c.to_rgb_u32()));
            arr.push(&JsValue::from(ci));
            draw.apply(&JsValue::NULL, &arr).unwrap();
        })
    }

    #[wasm_bindgen(js_name = "renderSprite")]
    pub fn render_sprite_js(
        &self,
        index: usize,
        palette_id: usize,
        transparent: bool,
        draw: js_sys::Function,
    ) {
        self.render_sprite(index, palette_id, transparent, |x, y, c, ci| {
            let arr = js_sys::Array::new();
            arr.push(&JsValue::from(x));
            arr.push(&JsValue::from(y));
            arr.push(&JsValue::from(c.to_rgb_u32()));
            arr.push(&JsValue::from(ci));
            draw.apply(&JsValue::NULL, &arr).unwrap();
        })
    }

    #[wasm_bindgen(js_name = "hittest")]
    pub fn hittest_js(
        &self,
        sprite_id: usize,
        hit_x: isize,
        hit_y: isize,
        transparent: bool,
    ) -> Option<HittestResult> {
        self.hittest(sprite_id, hit_x, hit_y, transparent)
    }

    #[wasm_bindgen(js_name = "setPixelByIndex")]
    pub fn set_pixel_by_index_js(
        &mut self,
        tile_id: usize,
        pixel_index: usize,
        color_index: usize,
    ) {
        self.set_pixel_by_index(tile_id, pixel_index, color_index);
    }

    #[wasm_bindgen(js_name = "fromJS")]
    pub fn from_js(js_value: JsValue) -> Result<SFSpriteEditor, serde_wasm_bindgen::Error> {
        Ok(Self {
            data: serde_wasm_bindgen::from_value(js_value)?,
            redo_stack: Vec::new(),
            redo_index: 0,
        })
    }

    #[wasm_bindgen(js_name = "clone")]
    pub fn clone_js(&self) -> SFSpriteEditor {
        self.clone()
    }

    #[wasm_bindgen(js_name = "record")]
    pub fn record_js(&mut self) {
        self.record();
    }

    #[wasm_bindgen(js_name = "undo")]
    pub fn undo_js(&mut self) {
        self.undo();
    }

    #[wasm_bindgen(js_name = "redo")]
    pub fn redo_js(&mut self) {
        self.redo();
    }
}
