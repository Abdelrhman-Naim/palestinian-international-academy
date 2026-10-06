import fs from 'fs';
import path from 'path';

export function setupPageLogger(page, testName) {
  const issues = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign noise like favicon 404 or expected test logs
      if (!text.includes('favicon.ico') && !text.includes('socket.io') && !text.includes('Failed to load resource: the server responded with a status of 404 ()')) {
        issues.push({
          type: 'CONSOLE_ERROR',
          test: testName,
          url: page.url(),
          message: text,
        });
      }
    }
  });

  page.on('pageerror', (err) => {
    issues.push({
      type: 'PAGE_EXCEPTION',
      test: testName,
      url: page.url(),
      message: err.message,
      stack: err.stack,
    });
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon.ico') && !url.includes('hot-update')) {
      issues.push({
        type: 'HTTP_ERROR',
        test: testName,
        url: page.url(),
        requestUrl: url,
        status,
        statusText: response.statusText(),
      });
    }
  });

  return issues;
}

export function saveAuditReport(reportFile, issues) {
  try {
    const dir = path.dirname(reportFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing = [];
    if (fs.existsSync(reportFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      } catch (e) {
        existing = [];
      }
    }
    const combined = [...existing, ...issues];
    fs.writeFileSync(reportFile, JSON.stringify(combined, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save audit report:', err);
  }
}
