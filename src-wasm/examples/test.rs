use show_image::*;
use src_wasm::*;

#[main]
fn main() {
    let sprite_data = std::fs::read(std::env::args().nth(1).unwrap()).unwrap();
    let sprite = SFSpriteEditor::from_data(&sprite_data).unwrap();
    let mut buf = vec![0u8; 4 * 256 * 256];
    sprite.render_sprite(0, 0, true, |x, y, color, _index| {
        let x = (x + 128) as usize;
        let y = (y + 128) as usize;
        let offset = (y * 256 + x) * 4;
        buf[offset] = color.r();
        buf[offset + 1] = color.g();
        buf[offset + 2] = color.b();
        buf[offset + 3] = 255;
    });
    let image = ImageView::new(ImageInfo::rgba8(256, 256), &buf);
    let window = create_window("render test", Default::default()).unwrap();
    window.set_image("sprite", image).unwrap();
    window.wait_until_destroyed().unwrap();
}
