const fs = require('fs');

let navbar = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

// Ensure very sleek navbar
navbar = navbar.replace('className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-7xl mx-auto bg-white/70 dark:bg-black/50 backdrop-blur-xl z-50 border-b border-gray-200/50 dark:border-primary/20 sticky top-0 transition-all duration-300"',
'className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-7xl mx-auto bg-white/60 dark:bg-[#030303]/60 backdrop-blur-2xl z-50 border-b border-gray-200/50 dark:border-white/5 sticky top-0 transition-all duration-300"');

// Enhance links
navbar = navbar.replace(/hover:text-primary transition-colors/g, 'hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]');

fs.writeFileSync('src/components/Navbar.jsx', navbar);
console.log('Navbar updated');
