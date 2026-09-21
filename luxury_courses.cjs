const fs = require('fs');

let courses = fs.readFileSync('src/components/PopularCourses.jsx', 'utf8');

// Upgrade section padding and bg
courses = courses.replace('className="py-24 bg-white dark:bg-black"',
'className="py-32 bg-white dark:bg-[#030303] relative"');

// Upgrade card container
courses = courses.replace(/className="bg-gray-50 dark:bg-\[\#0a0a0a\] rounded-2xl overflow-hidden hover-lift border border-gray-100 dark:border-primary\/20 flex flex-col/g,
'className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.3)] transition-all duration-500 border border-gray-200/80 dark:border-white/10 flex flex-col group');

// Upgrade course image container to have a subtle overlay
courses = courses.replace(/<div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-\[\#111\]">/g,
'<div className="relative h-56 overflow-hidden bg-gray-200 dark:bg-black/50">\n                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>');

// Upgrade tags
courses = courses.replace(/className="absolute top-4 right-4 bg-white\/90 dark:bg-black\/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary"/g,
'className="absolute top-4 right-4 bg-white/90 dark:bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-primary border border-primary/20 z-20 shadow-lg"');

// Upgrade course title
courses = courses.replace(/className="font-headline-md text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2"/g,
'className="font-headline-md text-2xl font-bold mb-3 text-gray-900 dark:text-white line-clamp-2 tracking-tight group-hover:text-primary transition-colors"');

fs.writeFileSync('src/components/PopularCourses.jsx', courses);
console.log('Courses updated');
