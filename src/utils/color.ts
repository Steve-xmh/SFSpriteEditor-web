/**
 * @fileoverview
 * 用于转换颜色
 */

export type Color = [number, number, number, number] | [number, number, number]

/**
 * 转换 GBA 颜色到 RGB 颜色
 * GBA 颜色格式：
 * 0b1 00000 00000 00000
 *   A RRRRR GGGGG BBBBB
 * @param color 要转换的颜色字节值，必须是 u16
 * @returns RGB 排列的颜色，每个数范围在 [0x00, 0xFF]
 */
export function gbaToRGB(color: number): Color {
    if (color < 0x0000 || color > 0xFFFF) {
        throw new Error('Invalid color');
    }
    const b = (color >> 10 & 0b11111) / 0b11111 * 0xFF
    const g = (color >> 5 & 0b11111) / 0b11111 * 0xFF
    const r = (color & 0b11111) / 0b11111 * 0xFF
    // console.log(color.toString(16), r, g, b)
    return [r | 0, g | 0, b | 0]
}

/**
 * 转换 RGB 颜色到 GBA 颜色
 * @param color RGB 排列的颜色，每个数范围在 [0x00, 0xFF]
 * @param 返回 u16 的 GBA 颜色值
 */
export function rgbToGBA(color: Color): number {
    const [r, g, b] = color.map(v => ((v & 0xFF) / 0xFF * 0b11111) | 0)
    return b << 10 | g << 5 | r
}

/**
 * 转换 NDS 颜色到 RGB 颜色
 * GBA 颜色格式：
 * 0b1 00000 00000 00000
 *   A RRRRR GGGGG BBBBB
 * @param color 要转换的颜色字节值，必须是 u16
 * @returns RGBA 排列的颜色，每个数范围在 [0x00, 0xFF]
 */
export function ndsToRGB(color: number): Color {
    const a = (color >> 15 & 0b1) * 0xFF
    const b = (color >> 10 & 0b11111) / 0b11111 * 0xFF
    const g = (color >> 5 & 0b11111) / 0b11111 * 0xFF
    const r = (color & 0b11111) / 0b11111 * 0xFF
    return [r | 0, g | 0, b | 0, a | 0]
}

/**
 * 转换 RGB 颜色到 NDS 颜色
 * @param color RGBA 排列的颜色，每个数范围在 [0x00, 0xFF]
 * @returns 返回 u16 的 GBA 颜色值
 */
export function rgbToNDS(color: Color): number {
    const [r, g, b] = color.map(v => ((v & 0xFF) / 0xFF * 0b11111) | 0)
    const a = color[3] === 0xFF ? 0b1 : 0b0
    return a << 15 | b << 10 | g << 5 | r
}

/**
 * 转换 RGB(A) 颜色到十六进制方式 #RGBA
 * @param color RGBA 排列的颜色，每个数范围在 [0x00, 0xFF]
 */
export function rgbaToHexRGBA(color: Color): string {
    return '#' + color.map(
        v => v.toString(16)
    ).map(
        v => '0'.repeat(2 - v.length) + v
    ).join('')
}

/**
 * 转换 RGB(A) 颜色到十六进制方式 #ARGB
 * @param color RGBA 排列的颜色，每个数范围在 [0x00, 0xFF]
 */
export function rgbaToHexARGB(color: Color): string {
    if (color.length === 3) {
        return '#FF' + color.map(
            v => v.toString(16)
        ).map(
            v => '0'.repeat(2 - v.length) + v
        ).join('')
    } else if (color.length === 4) {
        const a = color[3].toString(16)
        return '#' + '0'.repeat(2 - a.length) + a + color.slice(1, 4).map(
            v => v.toString(16)
        ).map(
            v => '0'.repeat(2 - v.length) + v
        ).join('')
    }
}
