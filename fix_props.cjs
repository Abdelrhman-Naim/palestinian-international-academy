const fs = require('fs');
const files = [
    { name: 'AdminUsers.jsx', parent: 'adminOverview.students', title: 'adminOverview.students', subtitle: 'adminOverview.manageStudentsDesc', icon: 'group' },
    { name: 'AdminCourses.jsx', parent: 'navbar.courses', title: 'adminOverview.courses', subtitle: 'adminOverview.manageCoursesDesc', icon: 'school' },
    { name: 'AdminInstructors.jsx', parent: 'adminOverview.instructors', title: 'adminOverview.instructors', subtitle: 'adminOverview.manageInstructorsDesc', icon: 'supervisor_account' },
    { name: 'AdminLibrary.jsx', parent: 'navbar.library', title: 'adminOverview.library', subtitle: 'adminOverview.manageLibraryDesc', icon: 'local_library' },
    { name: 'AdminCategories.jsx', parent: 'navbar.courses', title: 'addCourse.category', subtitle: 'adminOverview.manageCategoriesDesc', icon: 'category' },
    { name: 'AdminLibraryCategories.jsx', parent: 'navbar.library', title: 'addCourse.category', subtitle: 'adminOverview.manageLibraryCatDesc', icon: 'category' }
];

files.forEach(f => {
    const path = 'src/pages/admin/' + f.name;
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(/<AdminPageShell[\s\S]*?icon="[^"]*"\s*>/, 
        '<AdminPageShell\n' +
        '      parent={t("' + f.parent + '")}\n' +
        '      title={t("' + f.title + '")}\n' +
        '      subtitle={t("' + f.subtitle + '")}\n' +
        '      icon="' + f.icon + '"\n' +
        '    >');
        fs.writeFileSync(path, content, 'utf8');
    }
});
