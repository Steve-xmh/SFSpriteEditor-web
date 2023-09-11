use binrw::*;
use std::fmt::Debug;

#[binrw]
#[brw(little)]
#[derive(Default)]
pub struct GBAColor(u16);

impl Debug for GBAColor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\x1b[48;2;{};{};{}mColor({:#06x})\x1b[0m",
            self.r(),
            self.g(),
            self.b(),
            self.0
        )
    }
}

impl GBAColor {
    pub fn r(&self) -> u8 {
        ((self.0 & 0x1F) * 8) as u8
    }

    pub fn g(&self) -> u8 {
        (((self.0 >> 5) & 0x1F) * 8) as u8
    }

    pub fn b(&self) -> u8 {
        (((self.0 >> 10) & 0x1F) * 8) as u8
    }

    pub fn to_rgb(&self) -> (u8, u8, u8) {
        (self.r(), self.g(), self.b())
    }

    pub fn to_rgb_u32(&self) -> u32 {
        let (r, g, b) = self.to_rgb();
        (r as u32) << 16 | (g as u32) << 8 | (b as u32)
    }
}
