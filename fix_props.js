const fs = require('fs');
const files = [
    { name: 'AdminUsers.jsx', parent: 'adminOverview.students', title: 'adminOverview.students', subtitle: 'adminOverview.manageStudentsDesc' },
    { name: 'AdminCourses.jsx', parent: 'navbar.courses', title: 'adminOverview.courses', subtitle: 'adminOverview.manageCoursesDesc' },
    { name: 'AdminInstructors.jsx', parent: 'adminOverview.instructors', title: 'adminOverview.instructors', subtitle: 'adminOverview.manageInstructorsDesc' },
    { name: 'AdminLibrary.jsx', parent: 'navbar.library', title: 'adminOverview.library', subtitle: 'adminOverview.manageLibraryDesc' },
    { name: 'AdminCategories.jsx', parent: 'navbar.courses', title: 'addCourse.category', subtitle: 'adminOverview.manageCategoriesDesc' },
    { name: 'AdminLibraryCategories.jsx', parent: 'navbar.library', title: 'addCourse.category', subtitle: 'adminOverview.manageLibraryCatDesc' }
];

files.forEach(f => {
    const path = 'src/pages/admin/' + f.name;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(/<AdminPageShell[\s\S]*?icon="[^"]*"\s*>/, 
        \<AdminPageShell
      parent={t('\')}
      title={t('\')}
      subtitle={t('\')}
      icon="settings"
    >\);
        fs.writeFileSync(path, content, 'utf8');
    }
});
