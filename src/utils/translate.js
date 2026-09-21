export async function translateText(text, targetLang = 'en') {
  if (!text) return text;
  
  // If it's an array, translate each item
  if (Array.isArray(text)) {
    return Promise.all(text.map(t => translateText(t, targetLang)));
  }

  // We use Google Translate free API endpoint (client=gtx)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // data[0] contains array of sentences
    if (data && data[0]) {
      return data[0].map(s => s[0]).join('');
    }
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // fallback to original text if fails
  }
}
