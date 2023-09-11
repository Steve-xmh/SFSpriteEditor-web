pub mod gbacolor;
pub mod sfsprite;
pub mod utils;

use binrw::prelude::*;
use sfsprite::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SFSpriteEditor {
    data: SFSpriteFileHeader,
    _render_buffer: Vec<u8>,
}

impl SFSpriteEditor {
    pub fn read_from_buffer(buffer: &[u8]) -> BinResult<SFSpriteEditor> {
        let mut cursor = std::io::Cursor::new(buffer);
        let data = SFSpriteFileHeader::read(&mut cursor)?;
        let _render_buffer = vec![0; 256 * 256 * 4];
        Ok(SFSpriteEditor {
            data,
            _render_buffer,
        })
    }

    pub fn export_to_buffer(&self) -> BinResult<Vec<u8>> {
        let mut buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buffer);
        self.data.write_le(&mut cursor)?;
        Ok(buffer)
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
}
