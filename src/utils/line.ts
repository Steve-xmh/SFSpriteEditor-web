export function * line (x0: number, y0: number, x1: number, y1: number) {
    // Bresenham
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let e2 = 0
    while (true) {
        yield [x0, y0]
        if (x0 === x1 && y0 === y1) break
        e2 = 2 * err
        if (e2 > -dy) {
            err -= dy
            x0 += sx
        }
        if (e2 < dx) {
            err += dx
            y0 += sy
        }
    }
}
