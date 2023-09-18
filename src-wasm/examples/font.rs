use std::io::Cursor;

use binrw::{BinRead, BinWrite};
use json::*;
use src_wasm::font::*;

// args: [GRAPH_WIDTH]x[GRAPH_HEIGHT] [INPUT] [OUTPUT]
fn main() {
    let graph_size = std::env::args().nth(1).unwrap();
    let (graph_width, graph_height) = graph_size.split_once('x').unwrap();
    let input_file = std::env::args().nth(2).unwrap();
    let output_file = std::env::args().nth(3).unwrap_or_else(|| {
        // replace input file extension to .sfont
        let mut output_file = input_file.clone();
        if let Some(pos) = output_file.rfind('.') {
            output_file.replace_range(pos.., ".sfont");
        } else {
            output_file.push_str(".sfont");
        }
        output_file
    });
    let graph_width = graph_width.parse::<u8>().unwrap();
    let graph_height = graph_height.parse::<u8>().unwrap();
    if let Ok(JsonValue::Object(obj)) = json::parse(&std::fs::read_to_string(input_file).unwrap()) {
        let mut font = SFFont {
            graph_size: (graph_width, graph_height),
            ..Default::default()
        };
        for (key, obj) in obj.iter() {
            let code = str::parse::<u32>(key).unwrap();
            if let JsonValue::Array(arr) = obj {
                let mut graph = SFFontGraph {
                    code,
                    data_width: graph_width,
                    ..Default::default()
                };
                graph.width = arr.get(0).unwrap().as_u8().unwrap();
                graph.height = arr.get(1).unwrap().as_u8().unwrap();
                let font_data = arr.get(2).unwrap().as_str().unwrap().to_owned();
                let mut pixel_data = Vec::<u8>::with_capacity(font_data.len());
                for c in font_data.chars() {
                    match c {
                        '1' => {
                            pixel_data.push(0b01);
                        }
                        '2' => {
                            pixel_data.push(0b10);
                        }
                        '3' => {
                            pixel_data.push(0b11);
                        }
                        _ => {
                            pixel_data.push(0b00);
                        }
                    }
                }
                let pixel_data = pixel_data
                    .chunks_exact(4)
                    .map(|data| {
                        data.iter()
                            .enumerate()
                            .fold(0, |acc, (i, &data)| acc | (data << (i * 2)))
                    })
                    .collect();
                graph.data = pixel_data;
                assert_eq!(
                    graph.data.len(),
                    graph_width as usize * graph_height as usize / 4
                );
                if graph.data.iter().any(|x| *x != 0) {
                    font.graphs.push(graph);
                }
            }
        }

        font.graphs.sort_by(|a, b| a.code.cmp(&b.code));

        let mut font_data = Cursor::new(Vec::<u8>::new());

        font.write_le(&mut font_data).unwrap();

        let font_data = font_data.into_inner();

        std::fs::write(output_file, &font_data).unwrap();

        let sec_font = SFFont::read_le(&mut Cursor::new(font_data.to_owned())).unwrap();

        assert_eq!(font, sec_font);
    }
}
