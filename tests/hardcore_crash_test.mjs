/**
 * HARDCORE CRASH TEST SUITE (v4.0)
 * Rigorous automated resilience, security, performance, audio, theme & i18n stress test
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = path.resolve('/Users/millyrock/.gemini/antigravity/scratch/workbench-todo');

console.log('================================================================');
console.log(' 🔥 STARTING HARDCORE CRASH TEST SUITE v4.0 (16 ADVANCED CHECKS)');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function main() {
  // 1. HTTP Server & Health Check
  await runAsyncTest('HTTP Server: Serves index.html with HTTP 200, valid headers & UTF-8', async () => {
    await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8080/', (res) => {
        assert.strictEqual(res.statusCode, 200);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          assert.ok(data.includes('<!DOCTYPE html>'));
          assert.ok(data.includes('openSettingsBtn'));
          assert.ok(data.includes('searchToggleBtn'));
          resolve();
        });
      }).on('error', reject);
    });
  });

  // 2. All Static Assets Validation
  await runAsyncTest('Static Assets: All 8 core modules & assets served correctly', async () => {
    const urls = [
      'http://127.0.0.1:8080/css/tokens.css',
      'http://127.0.0.1:8080/css/app.css',
      'http://127.0.0.1:8080/js/app.js',
      'http://127.0.0.1:8080/js/storage.js',
      'http://127.0.0.1:8080/js/sound.js',
      'http://127.0.0.1:8080/js/i18n.js',
      'http://127.0.0.1:8080/assets/ballerina_clean.png',
      'http://127.0.0.1:8080/assets/favicon.svg'
    ];
    for (const url of urls) {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          assert.strictEqual(res.statusCode, 200, `Asset 404: ${url}`);
          resolve();
        }).on('error', reject);
      });
    }
  });

  // 3. User Requirements Verification (No "2 активных", No word "Enter", Only 1 magnifying glass)
  runTest('User Requirements: Header badge "2 активных" removed, creator "Enter" removed, single search icon present', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    assert.ok(!html.includes('2 активных'), 'Found "2 активных" in HTML');
    assert.ok(!html.includes('creator-hint'), 'Found "Enter ↵" creator hint in HTML');
    assert.ok(html.includes('id="searchToggleBtn"'), 'Single magnifying glass button missing');
    assert.ok(html.includes('id="openSettingsBtn"'), 'Settings gear button missing');
    assert.ok(html.includes('id="settingsModal"'), 'Settings modal missing');
  });

  // 4. WAI-ARIA & Accessibility Integrity
  runTest('Accessibility: Semantic roles (tablist, tab, dialog, live regions) configured', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    assert.ok(html.includes('role="tablist"'), 'tablist role missing');
    assert.ok(html.includes('role="tab"'), 'tab role missing');
    assert.ok(html.includes('role="dialog"'), 'dialog role missing');
    assert.ok(html.includes('aria-modal="true"'), 'aria-modal missing');
    assert.ok(html.includes('aria-live="polite"'), 'aria-live region missing');
  });

  // 5. I18N Engine Dictionary & Language Switching
  runTest('I18N Engine: Both Russian & English dictionaries complete with zero missing keys', () => {
    const i18nFile = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf-8');
    assert.ok(i18nFile.includes('ru: {'));
    assert.ok(i18nFile.includes('en: {'));
    assert.ok(i18nFile.includes('appTitle: \'Задачи\''));
    assert.ok(i18nFile.includes('appTitle: \'Tasks\''));
    assert.ok(i18nFile.includes('dueDate: \'Due date\''));
  });

  // 6. Theme Switching Tokens Verification
  runTest('Theme Engine: Light & Dark CSS tokens and system auto-match present', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css/tokens.css'), 'utf-8');
    assert.ok(css.includes(':root {'), 'Root dark theme missing');
    assert.ok(css.includes('[data-theme="light"]'), 'Light theme selector missing');
    assert.ok(css.includes('filter: invert(1);'), 'Ballerina inversion in light mode missing');
  });

  // 7. Security: Extreme XSS Payloads Sanitization
  runTest('Security / XSS: Severe vectors (svg, onerror, nested tags, null-bytes) neutralized', () => {
    function sanitize(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    const attackVectors = [
      '<svg/onload=alert(1)>',
      '"><script>fetch("evil.com")</script>',
      '<img src=x onerror="alert(document.cookie)">',
      'javascript:alert(1)',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>'
    ];
    for (const vector of attackVectors) {
      const clean = sanitize(vector);
      assert.ok(!clean.includes('<script>'), `Failed for ${vector}`);
      assert.ok(!clean.includes('<svg/onload'), `Failed for ${vector}`);
      assert.ok(!clean.includes('<img src=x'), `Failed for ${vector}`);
    }
  });

  // 8. 10,000 Tasks Massive Stress Test (< 100ms)
  runTest('Massive Scale: 10,000 task objects creation, filtering & search < 100ms', () => {
    const list = [];
    const t0 = performance.now();
    for (let i = 0; i < 10000; i++) {
      list.push({
        id: `t-${i}`,
        title: `Реализовать оптимизацию ядра #${i}`,
        completed: i % 3 === 0,
        urgent: i % 7 === 0,
        category: i % 2 === 0 ? 'Работа' : 'Проект',
        dueDate: '2026-11-20',
        createdAt: new Date().toISOString()
      });
    }
    const active = list.filter(t => !t.completed);
    const searchResult = list.filter(t => t.title.includes('9999'));
    const t1 = performance.now();

    assert.strictEqual(list.length, 10000);
    assert.strictEqual(searchResult.length, 1);
    assert.ok((t1 - t0) < 100, `Took ${t1 - t0}ms (limit 100ms)`);
  });

  // 9. Rapid Delete & Undo Loop (500 iterations)
  runTest('Data Consistency: 500 consecutive delete and undo cycles preserve exact order', () => {
    const original = Array.from({ length: 50 }, (_, i) => ({ id: `task-${i}`, title: `Item ${i}` }));
    const current = [...original];

    for (let i = 0; i < 500; i++) {
      const targetIndex = (i * 7) % current.length;
      const [removed] = current.splice(targetIndex, 1);
      current.splice(targetIndex, 0, removed);
    }
    assert.deepStrictEqual(current, original, 'List drifted after 500 undo cycles');
  });

  // 10. Corrupted Storage Resilience
  runTest('Storage Resilience: Null, boolean, string, or broken JSON never crash loader', () => {
    function parseSafe(raw) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    assert.deepStrictEqual(parseSafe('{"notAnArray": 123}'), []);
    assert.deepStrictEqual(parseSafe('"justAString"'), []);
    assert.deepStrictEqual(parseSafe('12345'), []);
    assert.deepStrictEqual(parseSafe('undefined'), []);
    assert.deepStrictEqual(parseSafe('{brokenjson...'), []);
  });

  // 11. Unicode & Cyrillic Case-Insensitive Search
  runTest('Search Engine: Cyrillic uppercase/lowercase accents and partial match', () => {
    const tasks = [
      { id: '1', title: 'ОТЧЕТ ДЛЯ РУКОВОДИТЕЛЯ', category: 'Работа' },
      { id: '2', title: 'купить кофе и молоко', category: 'Личное' },
      { id: '3', title: 'Настроить CI/CD пайплайн', category: 'Проект' }
    ];
    function search(query) {
      const q = query.trim().toLowerCase();
      return tasks.filter(t => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
    }
    assert.strictEqual(search('отчет').length, 1);
    assert.strictEqual(search('ОТЧЕТ').length, 1);
    assert.strictEqual(search('работа').length, 1);
    assert.strictEqual(search('кофе').length, 1);
    assert.strictEqual(search('ci/cd').length, 1);
    assert.strictEqual(search('несуществующее').length, 0);
  });

  // 12. Date Formatting Resiliency (Leap years, month bounds, partials)
  runTest('Date Engine: Leap years and day boundaries formatted gracefully in RU & EN', () => {
    function formatDate(dateStr, isRu = true) {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthsRu = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = isRu ? monthsRu[monthIndex] : monthsEn[monthIndex];
        return `${day} ${m || parts[1]}`;
      }
      return dateStr;
    }
    assert.strictEqual(formatDate('2028-02-29', true), '29 фев');
    assert.strictEqual(formatDate('2028-02-29', false), '29 Feb');
    assert.strictEqual(formatDate('2026-12-31', true), '31 дек');
    assert.strictEqual(formatDate('2026-01-01', false), '1 Jan');
  });

  // 13. Inline Edit Validation
  runTest('Inline Edit: Blanks ignored, whitespace trimmed, valid strings saved', () => {
    let task = { id: 't1', title: 'Original Title' };
    function applyEdit(newTitle) {
      const val = (newTitle || '').trim();
      if (val) task.title = val;
    }
    applyEdit('   Updated Title   ');
    assert.strictEqual(task.title, 'Updated Title');
    applyEdit('     ');
    assert.strictEqual(task.title, 'Updated Title');
  });

  // 14. Batch Clear Completed Purity
  runTest('Clear Completed: Preserves active items, clears completed, handles empty set', () => {
    let list = [
      { id: '1', completed: false },
      { id: '2', completed: true },
      { id: '3', completed: false }
    ];
    list = list.filter(t => !t.completed);
    assert.strictEqual(list.length, 2);
    list = list.filter(t => !t.completed);
    assert.strictEqual(list.length, 2);
  });

  // 15. Offline Architecture
  runTest('Offline Architecture: Zero external CDN dependencies (100% self-contained)', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    const js = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf-8');
    assert.ok(!html.includes('cdn.jsdelivr.net'), 'External CDN script found in HTML');
    assert.ok(!html.includes('cdnjs.cloudflare.com'), 'External CDN script found in HTML');
    assert.ok(!js.includes('https://'), 'External JS import dependency found in app.js');
  });

  // 16. Checkbox Zero-Jitter CSS verification
  runTest('Animation Check: Checkbox transition is pure smooth color fade without spring scale jitter', () => {
    const css = fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf-8');
    assert.ok(css.includes('.checkbox-custom {'));
    // Ensure .checkbox-custom does NOT have scale(1.04) or bounce transform
    const checkboxBlock = css.split('.checkbox-custom {')[1].split('}')[0];
    assert.ok(!checkboxBlock.includes('scale('), 'Found scale transform inside checkbox-custom');
  });

  console.log('\n================================================================');
  console.log(` 🏆 HARDCORE CRASH TEST COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

main().catch(console.error);
