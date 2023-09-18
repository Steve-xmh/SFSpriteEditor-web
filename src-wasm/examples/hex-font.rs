use std::io::Cursor;

use binrw::BinWrite;
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
    let hex_font_data = std::fs::read_to_string(input_file).unwrap();
    let graph_width = graph_width.parse::<u8>().unwrap();
    let graph_height = graph_height.parse::<u8>().unwrap();
    let mut font = SFFont {
        graph_size: (graph_width, graph_height),
        ..Default::default()
    };
    for line in hex_font_data.split('\n') {
        let line = line.trim();
        if line.len() == 5 + graph_width as usize * graph_height as usize / 4 {
            if let Some((code, graph_data)) = line.split_once(':') {
                if let Ok(code) = u32::from_str_radix(code, 16) {
                    let mut graph = SFFontGraph {
                        code,
                        data_width: graph_width,
                        ..Default::default()
                    };
                    let mut pixel_data =
                        Vec::<u8>::with_capacity(graph_width as usize * graph_height as usize / 4);
                    for c in graph_data.chars() {
                        match c {
                            '0' => pixel_data.extend_from_slice(&[0, 0, 0, 0]),
                            '1' => pixel_data.extend_from_slice(&[0, 0, 0, 1]),
                            '2' => pixel_data.extend_from_slice(&[0, 0, 1, 0]),
                            '3' => pixel_data.extend_from_slice(&[0, 0, 1, 1]),
                            '4' => pixel_data.extend_from_slice(&[0, 1, 0, 0]),
                            '5' => pixel_data.extend_from_slice(&[0, 1, 0, 1]),
                            '6' => pixel_data.extend_from_slice(&[0, 1, 1, 0]),
                            '7' => pixel_data.extend_from_slice(&[0, 1, 1, 1]),
                            '8' => pixel_data.extend_from_slice(&[1, 0, 0, 0]),
                            '9' => pixel_data.extend_from_slice(&[1, 0, 0, 1]),
                            'A' | 'a' => pixel_data.extend_from_slice(&[1, 0, 1, 0]),
                            'B' | 'b' => pixel_data.extend_from_slice(&[1, 0, 1, 1]),
                            'C' | 'c' => pixel_data.extend_from_slice(&[1, 1, 0, 0]),
                            'D' | 'd' => pixel_data.extend_from_slice(&[1, 1, 0, 1]),
                            'E' | 'e' => pixel_data.extend_from_slice(&[1, 1, 1, 0]),
                            'F' | 'f' => pixel_data.extend_from_slice(&[1, 1, 1, 1]),
                            _ => {}
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
                    if graph.data.len() == graph_width as usize * graph_height as usize / 4
                        && graph.data.iter().any(|x| *x != 0)
                    {
                        font.graphs.push(graph);
                    }
                }
            }
        }
    }
    font.graphs.sort_by(|a, b| a.code.cmp(&b.code));

    let mut font_data = Cursor::new(Vec::<u8>::new());

    font.write_le(&mut font_data).unwrap();

    let font_data = font_data.into_inner();

    std::fs::write(output_file, font_data).unwrap();
}
