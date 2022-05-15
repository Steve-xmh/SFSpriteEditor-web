const fs = require('fs');
const font = require('../src/utils/fonts/font-cn-8x16-bold.json')

for (let i = 0x21; i < 0x7F; i++) {
    const fullWidthCode = 0xFF01 + i - 0x21
    if (fullWidthCode in font) {
        console.log(String.fromCharCode(i) + ': ' + i + ' ' + String.fromCharCode(fullWidthCode) + ' ' + (fullWidthCode) + ' ' + font[fullWidthCode])
        font[i] = font[fullWidthCode]
    }
}

fs.writeFileSync('src/utils/fonts/font-cn-8x16-bold.json', JSON.stringify(font))
