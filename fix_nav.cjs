const fs = require('fs');
let nav = fs.readFileSync('src/components/Navbar.jsx', 'utf8');
nav = nav.replace(/to=\{\/ \+ item\}/g, "to={'/' + item}");
nav = nav.replace(/startsWith\('\/' \+ item\)/g, "startsWith('/' + item)");
fs.writeFileSync('src/components/Navbar.jsx', nav);
