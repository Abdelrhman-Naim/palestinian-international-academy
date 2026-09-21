const fs = require('fs');

const files = [
    'src/pages/add-courses.jsx',
    'src/pages/EditCourse.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/CourseDetail.jsx',
    'src/pages/BookDetail.jsx',
    'src/pages/ManageAssignments.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // We only want to keep the FIRST occurrence of const { t, dir } = useLanguage(); inside the component
    // BUT wait, some files might have multiple components.
    // Let's just do it manually for these specific files where it's breaking.
    
    // In add-courses.jsx, keep only the one at the top of AddCourse component
    if (file.endsWith('add-courses.jsx')) {
        let count = 0;
        content = content.replace(/^[ \t]*const\s*\{\s*t,\s*dir\s*\}\s*=\s*useLanguage\(\);\s*$/gm, (match) => {
            count++;
            return count === 1 ? match : '';
        });
    }

    if (file.endsWith('EditCourse.jsx')) {
        let count = 0;
        content = content.replace(/^[ \t]*const\s*\{\s*t,\s*dir\s*\}\s*=\s*useLanguage\(\);\s*$/gm, (match) => {
            count++;
            return count === 1 ? match : '';
        });
    }
    
    // Same for others, most files only export ONE main component
    if (file.endsWith('AdminDashboard.jsx') || 
        file.endsWith('Dashboard.jsx') || 
        file.endsWith('ManageAssignments.jsx')) {
        let count = 0;
        content = content.replace(/^[ \t]*const\s*\{\s*t,\s*dir\s*\}\s*=\s*useLanguage\(\);\s*$/gm, (match) => {
            count++;
            return count === 1 ? match : '';
        });
    }

    fs.writeFileSync(file, content, 'utf8');
});
