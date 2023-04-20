// #BFBFBF #FFFFFF

const canvas = document.createElement("canvas");
canvas.width = canvas.height = 16;
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#BFBFBF";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "#FFFFFF";
ctx.fillRect(0, 0, canvas.width / 2, canvas.width / 2);
ctx.fillRect(8, 8, canvas.width / 2, canvas.width / 2);

export default canvas;
