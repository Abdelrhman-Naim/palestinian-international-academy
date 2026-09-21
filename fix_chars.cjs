const fs = require('fs');

let hero = fs.readFileSync('src/components/Hero.jsx', 'utf8');
hero = hero.replace(/\?\?/g, '✦');
fs.writeFileSync('src/components/Hero.jsx', hero);

let features = fs.readFileSync('src/components/Features.jsx', 'utf8');
features = features.replace(/className="w-16 h-16/g, 'className="w-20 h-20');
fs.writeFileSync('src/components/Features.jsx', features);

