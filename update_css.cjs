const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Update Dark body background to a deeper, more luxurious black
css = css.replace('background-color: #12100e;', 'background-color: #050505;');

// Update card hover shadow for a more luxurious glow
css = css.replace('rgba(208, 194, 2, 0.701)', 'rgba(212, 175, 55, 0.2)');

fs.writeFileSync('src/index.css', css);
