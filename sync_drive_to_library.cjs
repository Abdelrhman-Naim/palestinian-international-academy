const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ================= Configuration =================
const DRIVE_API_KEY = "AIzaSyDXqTUNs0CR0aTfQooSN5UgxeZ2kC6rKos";
const FOLDER_ID = "1tBZLeebMZVQwqAzMGtep6Auaws68IirJ";
const PROCESSED_FILES_PATH = "processed_books.json";
const FIREBASE_CREDENTIALS = "serviceAccountKey.json";
const DEFAULT_THREADS = 5;
// =================================================

// Prompt helper for threads count
async function getConcurrencyInput() {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--threads=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) return val;
    }
    const num = parseInt(arg, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  if (process.env.THREADS) {
    const val = parseInt(process.env.THREADS, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  if (process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`\x1b[36m[?] كم عدد الثريدز (المسارات المتوازية - Concurrency) المطلوبة؟ (الافتراضي: ${DEFAULT_THREADS}): \x1b[0m`, (answer) => {
        rl.close();
        const parsed = parseInt(answer.trim(), 10);
        if (!isNaN(parsed) && parsed > 0) {
          resolve(parsed);
        } else {
          console.log(`[+] تم اعتماد عدد الثريدز الافتراضي: ${DEFAULT_THREADS}`);
          resolve(DEFAULT_THREADS);
        }
      });
    });
  }

  console.log(`[+] وضع غير تفاعلي. استخدام عدد الثريدز الافتراضي: ${DEFAULT_THREADS}`);
  return DEFAULT_THREADS;
}

// Helper for fetch with auto-retry
async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (err) {
      if (i === retries - 1) return null;
    }
    await new Promise(r => setTimeout(r, delayMs * (i + 1)));
  }
  return null;
}

// Translation cache
const translationCache = new Map();
async function translateText(text, targetLang = 'en') {
  if (!text) return text;
  if (translationCache.has(text)) return translationCache.get(text);

  if (Array.isArray(text)) {
    return Promise.all(text.map(t => translateText(t, targetLang)));
  }
  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text);
    const response = await fetchWithRetry(url);
    if (response) {
      const data = await response.json();
      if (data && data[0]) {
        const res = data[0].map(s => s[0]).join('');
        translationCache.set(text, res);
        return res;
      }
    }
    return text;
  } catch (error) {
    return text;
  }
}

// Save processed books atomically
function saveProcessedFiles(processedSet) {
  try {
    const arrayData = Array.from(processedSet);
    fs.writeFileSync(PROCESSED_FILES_PATH, JSON.stringify(arrayData, null, 2), 'utf8');
  } catch (err) {
    console.error("خطأ أثناء حفظ processed_books.json:", err.message);
  }
}

// Concurrent Pool Helper
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function run() {
  const threadsCount = await getConcurrencyInput();
  console.log(`\x1b[32m[🚀] جاري تشغيل سكريبت المزامنة المتعددة بـ ${threadsCount} ثريدز (Multi-threaded)...\x1b[0m\n`);

  if (!getApps().length) {
    const serviceAccount = JSON.parse(fs.readFileSync(FIREBASE_CREDENTIALS, 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();
  const drive = google.drive({ version: 'v3', auth: DRIVE_API_KEY });

  // Load local processed list
  let processedFilesArray = [];
  if (fs.existsSync(PROCESSED_FILES_PATH)) {
    try {
      processedFilesArray = JSON.parse(fs.readFileSync(PROCESSED_FILES_PATH, 'utf8'));
    } catch (e) {
      processedFilesArray = [];
    }
  }
  const processedSet = new Set(processedFilesArray);

  // Sync with Firestore existing library to double-check and prevent any duplication
  console.log("[🔍] فحص الكتب الموجودة مسبقاً في قاعدة بيانات Firestore لمنع التكرار...");
  try {
    const snapshot = await db.collection("library").select("driveId").get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.driveId) {
        processedSet.add(data.driveId.trim());
      }
    });
    saveProcessedFiles(processedSet);
    console.log(`[✔] تم التزامن مع Firestore. إجمالي الكتب المسجلة مسبقاً: ${processedSet.size}\n`);
  } catch (err) {
    console.warn("تعذر فحص Firestore مسبقاً، سيتم الاعتماد على الملف المحلي:", err.message);
  }

  // Helpers to list Google Drive folders & files with retry
  const getFolders = async (parentId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await drive.files.list({
          q: "'" + parentId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id, name)'
        });
        return res.data.files || [];
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return [];
  };

  const getFiles = async (folderId, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await drive.files.list({
          q: "'" + folderId + "' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id, name, webViewLink, mimeType, createdTime)'
        });
        return res.data.files || [];
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return [];
  };

  console.log("[📁] جاري فحص مجلدات Google Drive لاستخراج قائمة الكتب...");
  const categories = await getFolders(FOLDER_ID);
  const allTasks = [];

  for (const categoryFolder of categories) {
    const categoryName = categoryFolder.name;
    const authors = await getFolders(categoryFolder.id);

    for (const authorFolder of authors) {
      const authorName = authorFolder.name;
      const files = await getFiles(authorFolder.id);

      for (const file of files) {
        const cleanId = file.id ? file.id.trim() : "";
        if (cleanId && !processedSet.has(cleanId)) {
          allTasks.push({
            file,
            categoryName,
            authorName
          });
        }
      }
    }
  }

  console.log(`[📊] الإحصائيات:`);
  console.log(`   - إجمالي الكتب المسجلة مسبقاً: ${processedSet.size}`);
  console.log(`   - إجمالي الكتب الجديدة المتبقية: ${allTasks.length}`);

  if (allTasks.length === 0) {
    console.log("\n\x1b[32m[✨] لا توجد كتب جديدة للرفع. جميع الكتب مضافة مسبقاً!\x1b[0m");
    return;
  }

  let completedCount = 0;
  let successCount = 0;
  let failCount = 0;
  const totalNewTasks = allTasks.length;

  console.log(`\n[⚡] بدء الرفع والتعديل بتوازي ${threadsCount} ثريدز:\n`);

  const { PDFDocument } = require('pdf-lib');

  // Task processing function per item
  const processTask = async (task, index) => {
    const { file, categoryName, authorName } = task;
    const cleanId = file.id ? file.id.trim() : "";
    let title = file.name.replace(/\.[^/.]+$/, "");
    let link = file.webViewLink;
    let year = new Date(file.createdTime).getFullYear().toString();
    let pages = 0;

    // Smart double-check before work
    if (!cleanId || processedSet.has(cleanId)) return;

    const isPdf = file.mimeType === 'application/pdf' || 
                  (file.name && file.name.toLowerCase().endsWith('.pdf'));

    if (isPdf) {
      try {
        const downloadUrl = `https://drive.usercontent.google.com/download?id=${cleanId}&export=download`;
        const resp = await fetchWithRetry(downloadUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          redirect: 'follow'
        });
        
        if (resp) {
          const arrayBuffer = await resp.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          pages = pdfDoc.getPageCount();
        } else {
          // Fallback direct link
          const fallbackUrl = `https://docs.google.com/uc?export=download&id=${cleanId}&confirm=t`;
          const resp2 = await fetchWithRetry(fallbackUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            redirect: 'follow'
          });
          if (resp2) {
            const arrayBuffer = await resp2.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            pages = pdfDoc.getPageCount();
          }
        }
      } catch (err) {
        console.warn(`[⚠️] تعذر قراءة صفحات "${title}": ${err.message}`);
      }
    }

    const [title_en, author_en, category_en] = await Promise.all([
      translateText(title),
      translateText(authorName),
      translateText(categoryName)
    ]);

    const bookData = {
      title,
      title_en,
      author: authorName,
      author_en,
      category: categoryName,
      category_en,
      year,
      type: "كتاب",
      pages,
      link,
      driveId: cleanId
    };

    try {
      await db.collection("library").add(bookData);
      processedSet.add(cleanId);
      saveProcessedFiles(processedSet); // Smart resume checkpoint immediately saved!
      
      completedCount++;
      successCount++;
      console.log(`\x1b[32m[✔ ${completedCount}/${totalNewTasks}]\x1b[0m تمت إضافة: "${title}" (المؤلف: ${authorName} | القسم: ${categoryName} | الصفحات: ${pages})`);
    } catch (err) {
      completedCount++;
      failCount++;
      console.error(`\x1b[31m[✖ ${completedCount}/${totalNewTasks}]\x1b[0m فشل إضافة "${title}": ${err.message}`);
    }
  };

  await asyncPool(threadsCount, allTasks, processTask);

  console.log(`\n\x1b[32m[🎉] تم الانتهاء بنجاح! الإنجاز: ${successCount} كتاب جديد مُضاف, ${failCount} خطأ.\x1b[0m`);
}

run().catch(err => {
  console.error("\x1b[31m[💥] حدث خطأ غير متوقع في السكريبت:\x1b[0m", err);
});
