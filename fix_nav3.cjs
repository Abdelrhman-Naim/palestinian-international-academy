const fs = require('fs');
let nav = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

// The problematic block is around the nav links map
const oldBlockStart = '<nav className="hidden md:flex gap-8">';
const oldBlockEnd = '</nav>';

const newBlock = <nav className="hidden md:flex gap-8">
          {['courses', 'library', 'about'].map((item) => (
            <Link 
              key={item}
              to={'/' + item} 
              className={\ont-label-caps text-xs tracking-[0.1em] font-semibold transition-all duration-200 hover:text-primary \\}
            >
              {t('navbar.' + item)}
            </Link>
          ))}
        </nav>;

const startIndex = nav.indexOf(oldBlockStart);
const endIndex = nav.indexOf(oldBlockEnd) + oldBlockEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
    nav = nav.substring(0, startIndex) + newBlock + nav.substring(endIndex);
    fs.writeFileSync('src/components/Navbar.jsx', nav);
    console.log('Fixed Navbar');
} else {
    console.log('Could not find block');
}
