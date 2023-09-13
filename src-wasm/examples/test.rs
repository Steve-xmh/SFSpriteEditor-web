use show_image::*;
use src_wasm::*;

#[main]
fn main() {
    let sprite_data = include_bytes!("/Users/stevexmh/Documents/programs/Ryuusei-No-Rockman-3-CN/_workspace/blackace_unpacked/subscreen_local/subscreen_local_042.bin");
    let sprite = SFSpriteEditor::from_data(sprite_data).unwrap();
    let mut buf = vec![0u8; 4 * 256 * 256];
    sprite.render_sprite(0, 0, true, |x, y, color, index| {
        let x = (x + 128) as usize;
        let y = (y + 128) as usize;
        let offset = (y * 256 + x) * 4;
        buf[offset] = color.r();
        buf[offset + 1] = color.g();
        buf[offset + 2] = color.b();
        buf[offset + 3] = 255;
    });
    // add center cross red line
    // for y in 0..32 {
    //     for x in 0..256 {
    //         let offset = ((y * 8) * 256 + x) * 4;
    //         buf[offset] = buf[offset].wrapping_add(128);
    //         buf[offset + 3] = 255;
    //     }
    // }
    // for y in 0..256 {
    //     for x in 0..32 {
    //         let offset = (y * 256 + (x * 8)) * 4;
    //         buf[offset] = buf[offset].wrapping_add(128);
    //         buf[offset + 3] = 255;
    //     }
    // }
    let image = ImageView::new(ImageInfo::rgba8(256, 256), &buf);
    let window = create_window("render test", Default::default()).unwrap();
    window.set_image("sprite", image).unwrap();
    window.wait_until_destroyed().unwrap();
}