const {google}=require('googleapis');
const drive=google.drive({version:'v3',auth:'AIzaSyDXqTUNs0CR0aTfQooSN5UgxeZ2kC6rKos'});
drive.files.list({q: `'1tBZLeebMZVQwqAzMGtep6Auaws68IirJ' in parents`, fields:'files(*)'}).then(r => console.log(JSON.stringify(r.data.files[0], null, 2)))
