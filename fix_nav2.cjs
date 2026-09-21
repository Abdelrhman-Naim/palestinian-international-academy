const fs = require('fs');
let nav = fs.readFileSync('src/components/Navbar.jsx', 'utf8');
nav = nav.replace(/className=\{\u000Cont-label-caps text-xs tracking-\[0\.1em\] font-semibold transition-all duration-200 hover:text-primary \}/g, "className={ont-label-caps text-xs tracking-[0.1em] font-semibold transition-all duration-200 hover:text-primary \}");
fs.writeFileSync('src/components/Navbar.jsx', nav);
