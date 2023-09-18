use binrw::*;
use std::convert::TryFrom;

#[binrw]
#[brw(little)]
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct SFFont {
    pub graph_size: (u8, u8),
    #[bw(calc = graphs.len() as u32)]
    graphs_len: u32,
    #[br(count(graphs_len), args { inner: (graph_size.0 as u32 * graph_size.1 as u32 / 4,) })]
    pub graphs: Vec<SFFontGraph>,
}

impl SFFont {
    pub fn get_graph(&self, code: char) -> Option<&SFFontGraph> {
        self.graphs.iter().find(|x| x.code == code as u32)
    }

    pub fn draw_graph(&self, code: char, mut draw: impl FnMut(usize, usize, u8)) {
        if let Some(graph) = self.get_graph(code) {
            for (i, &data) in graph.data.iter().enumerate() {
                let x = i % graph.width as usize;
                let y = i / graph.width as usize;
                draw(x, y, data);
            }
        }
    }

    pub fn draw_text(&self, text: &str, mut draw: impl FnMut(usize, usize, u8)) {
        let mut x = 0;
        let mut y = 0;
        for c in text.chars() {
            if c == '\n' {
                x = 0;
                y += self.graph_size.1 as usize;
            } else if let Some(graph) = self.get_graph(c) {
                graph.draw_graph(|x_, y_, i| draw(x + x_, y + y_, i));
                x += graph.width as usize;
            }
        }
    }
}

#[binrw]
#[brw(little)]
#[br(import(graph_size: u32))]
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct SFFontGraph {
    pub code: u32,
    pub width: u8,
    pub height: u8,
    pub data_width: u8,
    #[br(count = graph_size)]
    pub data: Vec<u8>,
}

impl SFFontGraph {
    pub fn draw_graph(&self, mut draw: impl FnMut(usize, usize, u8)) {
        for (y, data) in self
            .data
            .chunks_exact((self.data_width / 4) as usize)
            .enumerate()
        {
            let mut px = 0usize;
            for &data in data {
                for j in 0..4 {
                    if px >= self.data_width as usize {
                        break;
                    }
                    if px < self.data_width as usize {
                        draw(px, y, (data >> (j * 2)) & 0b11);
                        px += 1;
                    }
                }
            }
        }
    }
}
