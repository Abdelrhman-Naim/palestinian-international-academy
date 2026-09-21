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
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/placeholder=([^\s>]+)/g, (match, p1) => {
        if (p1.startsWith('{t(') || p1.startsWith('\"') || p1.startsWith('\'')) return match;
        return 'placeholder=\"' + p1 + '\"';
    });
    content = content.replace(/parent=([^\s>]+)/g, (match, p1) => {
        if (p1.startsWith('{t(') || p1.startsWith('\"') || p1.startsWith('\'')) return match;
        return 'parent=\"' + p1 + '\"';
    });
    content = content.replace(/title=([^\s>]+)/g, (match, p1) => {
        if (p1.startsWith('{t(') || p1.startsWith('\"') || p1.startsWith('\'')) return match;
        return 'title=\"' + p1 + '\"';
    });
    content = content.replace(/subtitle=([^\s>]+)/g, (match, p1) => {
        if (p1.startsWith('{t(') || p1.startsWith('\"') || p1.startsWith('\'')) return match;
        return 'subtitle=\"' + p1 + '\"';
    });
    
    content = content.replace(/'([^'\n]*\{t\([^'\n]+\)\}[^'\n]*)'/g, (match, p1) => {
        return '\`' + p1.replace(/\{t\(/g, '${t(') + '\`';
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Fixed", file);
    }
});
