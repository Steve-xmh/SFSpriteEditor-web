use binrw::BinRead;
use image::*;
use show_image::*;
use src_wasm::font::*;

// args: [INPUT]
#[main]
fn main() {
    let font =
        SFFont::read(&mut std::fs::File::open(std::env::args().nth(1).unwrap()).unwrap()).unwrap();
    let mut img = image::RgbImage::new(
        font.graph_size.0 as u32 * 256,
        font.graph_size.1 as u32 * 256,
    );
    img.fill(0xff);
    for g in &font.graphs {
        let x = g.code % 256;
        let y = g.code / 256;
        g.draw_graph(|px, py, i| match i {
            1 => {
                img.put_pixel(
                    x * font.graph_size.0 as u32 + px as u32,
                    y * font.graph_size.1 as u32 + py as u32,
                    Rgb([0, 0, 0]),
                );
            }
            2 => {
                img.put_pixel(
                    x * font.graph_size.0 as u32 + px as u32,
                    y * font.graph_size.1 as u32 + py as u32,
                    Rgb([172, 172, 172]),
                );
            }
            3 => {
                img.put_pixel(
                    x * font.graph_size.0 as u32 + px as u32,
                    y * font.graph_size.1 as u32 + py as u32,
                    Rgb([225, 225, 225]),
                );
            }
            _ => {}
        });
    }

    let image = ImageView::new(ImageInfo::rgb8(img.width(), img.height()), img.as_raw());
    let window = create_window("font preview test", Default::default()).unwrap();
    window.set_image("sprite", image).unwrap();
    window.wait_until_destroyed().unwrap();
}
