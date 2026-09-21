const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = [...walk('src/components'), ...walk('src/pages')];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Navbar specific
    if (f.includes('Navbar.jsx')) {
        content = content.replace(
            'bg-amber-100 dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800 sticky top-0 transition-colors',
            'bg-white/70 dark:bg-black/50 backdrop-blur-xl z-50 border-b border-gray-200/50 dark:border-primary/20 sticky top-0 transition-all duration-300'
        );
        changed = true;
    }

    // Hero specific
    if (f.includes('Hero.jsx')) {
        content = content.replace('bg-dark text-white', 'bg-gradient-to-b from-black to-[#0a0a0a] text-white');
        content = content.replace('bg-dark border-b border-t border-gray-800', 'bg-black border-y border-primary/10');
        changed = true;
    }

    // Footer specific
    if (f.includes('Footer.jsx')) {
        content = content.replace('bg-dark', 'bg-[#050505] border-t border-primary/20');
        changed = true;
    }

    // General substitutions
    let newContent = content
        .replace(/bg-dark/g, 'bg-black')
        .replace(/bg-gray-900/g, 'bg-[#0a0a0a]')
        .replace(/bg-gray-800/g, 'bg-[#111]')
        .replace(/border-gray-700/g, 'border-primary/20')
        .replace(/border-gray-800/g, 'border-primary/10')
        .replace(/text-gray-400/g, 'text-gray-300')
        .replace(/shadow-xl/g, 'shadow-2xl shadow-primary/5')
        .replace(/rounded-lg/g, 'rounded-xl')
        .replace(/rounded-md/g, 'rounded-lg');

    if (newContent !== content || changed) {
        fs.writeFileSync(f, newContent, 'utf8');
    }
});
console.log('Done luxury update');
