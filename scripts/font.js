const fs = require('fs')
const font = require('../src/utils/fonts/simsun.json')

const dest = {}

for (const [id, width, graph] of font.characters) {
    dest[id] = [width, font.font_height, graph]
}

fs.writeFileSync('src/utils/fonts/font-simsun-11x11.json', JSON.stringify(dest))
