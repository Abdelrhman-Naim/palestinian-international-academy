const { Jimp } = require('jimp');

async function getColors() {
    try {
        const image = await Jimp.read('src/assets/logo.jpg');
        const colorCounts = {};
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            const hex = rgbToHex(r, g, b);
            
            // Skip whites and very light grays to find actual colors
            if (r > 240 && g > 240 && b > 240) return;
            // Skip blacks
            if (r < 20 && g < 20 && b < 20) return;
            
            if (colorCounts[hex]) {
                colorCounts[hex]++;
            } else {
                colorCounts[hex] = 1;
            }
        });
        
        // Sort colors by frequency
        const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        
        console.log("Top 10 dominant colors (excluding pure white/black):");
        for(let i=0; i<Math.min(10, sortedColors.length); i++) {
            console.log(sortedColors[i][0] + " : " + sortedColors[i][1] + " pixels");
        }
    } catch (err) {
        console.error(err);
    }
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

getColors();
