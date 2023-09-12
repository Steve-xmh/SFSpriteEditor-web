pub mod gbacolor;
pub mod sfsprite;
pub mod utils;

use binrw::prelude::*;
use gbacolor::GBAColor;
use sfsprite::*;
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
    utils::set_panic_hook();
}

impl SFSpriteEditor {
    pub fn read_from_buffer(buffer: &[u8]) -> BinResult<SFSpriteEditor> {
        let mut cursor = std::io::Cursor::new(buffer);
        let data = SFSpriteFileHeader::read(&mut cursor)?;
        Ok(SFSpriteEditor {
            redo_stack: vec![data.clone()],
            redo_index: 0,
            data,
        })
    }

    pub fn export_to_buffer(&self) -> BinResult<Vec<u8>> {
        let mut buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buffer);
        self.data.write_le(&mut cursor)?;
        Ok(buffer)
    }

    pub fn render_tile(
        &self,
        index: usize,
        palette_id: usize,
        draw: impl Fn(usize, usize, GBAColor, usize),
    ) {
        let palette = &self.data.palette_header.palettes[palette_id];
        match self.data.palette_header.color_depth {
            ColorDepth::Depth4BPP => {
                self.data.tileset_header.tileset_data[index * 32..(index + 1) * 32]
                    .iter()
                    .enumerate()
                    .for_each(|(i, byte)| {
                        let x = (i % 4) * 2;
                        let y = i / 4;
                        let left_color_index = (byte & 0xF) as usize;
                        let left_color = palette[left_color_index];
                        draw(x, y, left_color, left_color_index);
                        let right_color_index = (byte >> 4 & 0xF) as usize;
                        let right_color = palette[right_color_index];
                        draw(x + 1, y, right_color, right_color_index);
                    });
            }
            ColorDepth::Depth8BPP => {
                self.data.tileset_header.tileset_data[index * 64..(index + 1) * 64]
                    .iter()
                    .enumerate()
                    .for_each(|(i, byte)| {
                        let x = i % 8;
                        let y = i / 8;
                        let color_index = *byte as usize;
                        let color = palette[color_index];
                        draw(x, y, color, color_index);
                    });
            }
        }
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
    #[wasm_bindgen(js_name = "readFromBuffer")]
    pub fn read_from_buffer_js(buffer: &[u8]) -> Result<SFSpriteEditor, String> {
        match Self::read_from_buffer(buffer) {
            Ok(data) => Ok(data),
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
            arr.push(&JsValue::from(x as u32));
            arr.push(&JsValue::from(y as u32));
            arr.push(&JsValue::from(c.to_rgb_u32()));
            arr.push(&JsValue::from(ci as u32));
            draw.apply(&JsValue::NULL, &arr).unwrap();
        })
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
