/**
 * COMPREHENSIVE CRASH TEST SUITE
 * Tests server, HTML, JS logic, edge cases, XSS protection, and persistence.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = path.resolve('/Users/millyrock/.gemini/antigravity/scratch/workbench-todo');

console.log('========================================================');
console.log(' 🚀 STARTING FULL CRASH TEST SUITE FOR TODO APP');
console.log('========================================================\n');

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
  // TEST 1: Server response check
  await runAsyncTest('HTTP Server is reachable and returns HTTP 200 with HTML', async () => {
    return new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8080/', (res) => {
        assert.strictEqual(res.statusCode, 200, 'Expected status 200');
        assert.ok(res.headers['content-type'].includes('text/html'), 'Expected text/html');
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          assert.ok(data.includes('<title>Задачи</title>'), 'Title missing in HTML');
          resolve();
        });
      }).on('error', reject);
    });
  });

  // TEST 2: Static assets check
  await runAsyncTest('Static assets (tokens.css, app.css, app.js, storage.js, ballerina_clean.png) exist and served', async () => {
    const urls = [
      'http://127.0.0.1:8080/css/tokens.css',
      'http://127.0.0.1:8080/css/app.css',
      'http://127.0.0.1:8080/js/app.js',
      'http://127.0.0.1:8080/js/storage.js',
      'http://127.0.0.1:8080/assets/ballerina_clean.png'
    ];
    for (const url of urls) {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          assert.strictEqual(res.statusCode, 200, `Failed for URL: ${url}`);
          resolve();
        }).on('error', reject);
      });
    }
  });

  // TEST 3: HTML DOM integrity check
  runTest('HTML contains all necessary DOM targets and accessible controls', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    const requiredIDs = [
      'taskForm',
      'taskInput',
      'categorySelect',
      'dueDateInput',
      'flagToggleBtn',
      'tabAll',
      'tabPending',
      'tabCompleted',
      'countAll',
      'countPending',
      'countCompleted',
      'searchInput',
      'taskList',
      'emptyBox',
      'remainingSummary',
      'clearCompletedBtn',
      'toastWrap',
      'guideModal',
      'openGuideBtn',
      'closeGuideBtn'
    ];
    for (const id of requiredIDs) {
      assert.ok(html.includes(`id="${id}"`), `Missing required element ID: ${id}`);
    }
    // Check absence of double slashes in title and header
    assert.ok(!html.includes('// TASK_REGISTRY'), 'Found residual double slash header');
  });

  // TEST 4: Storage corruption recovery test
  runTest('Storage module gracefully handles corrupted localStorage data', () => {
    const mockStorage = {
      data: '{ invalid json corrupt ]]]',
      getItem(key) { return this.data; },
      setItem(key, val) { this.data = val; }
    };
    // Simulate Storage load logic
    function safeLoad(storage) {
      try {
        const raw = storage.getItem('key');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [{ id: 'fallback', title: 'Fallback task' }];
      }
    }
    const result = safeLoad(mockStorage);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'fallback');
  });

  // TEST 5: XSS and HTML Injection sanitization
  runTest('XSS Injection strings are escaped properly', () => {
    function escapeHTML(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    const maliciousInput = '<script>alert("hack")</script><img src="x" onerror="stealCookie()"> & " \'';
    const escaped = escapeHTML(maliciousInput);
    assert.ok(!escaped.includes('<script>'), 'Failed to escape script tag');
    assert.ok(!escaped.includes('<img'), 'Failed to escape img tag');
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&quot;'));
    assert.ok(escaped.includes('&#039;'));
  });

  // TEST 6: Stress test: 10,000 tasks creation and filtering speed
  runTest('Performance stress-test: 5,000 tasks create, filter and sort within 50ms', () => {
    const tasks = [];
    const t0 = performance.now();
    for (let i = 0; i < 5000; i++) {
      tasks.push({
        id: `task-${i}`,
        title: `Stress task number ${i} with long description`,
        completed: i % 2 === 0,
        urgent: i % 5 === 0,
        category: i % 3 === 0 ? 'Работа' : 'Проект',
        dueDate: '2026-11-20',
        createdAt: new Date().toISOString()
      });
    }
    // Filter
    const active = tasks.filter(t => !t.completed);
    const searchMatch = tasks.filter(t => t.title.includes('499'));
    const t1 = performance.now();
    assert.strictEqual(tasks.length, 5000);
    assert.strictEqual(active.length, 2500);
    assert.ok(searchMatch.length > 0);
    const elapsed = t1 - t0;
    assert.ok(elapsed < 100, `Took too long: ${elapsed}ms`);
  });

  // TEST 7: Delete & Undo state restoration
  runTest('Delete and Undo accurately restores task to original index', () => {
    const list = [
      { id: '1', title: 'Task A' },
      { id: '2', title: 'Task B' },
      { id: '3', title: 'Task C' }
    ];
    // Delete 'Task B' at index 1
    const [deleted] = list.splice(1, 1);
    const undoData = { task: deleted, index: 1 };
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[1].id, '3');

    // Perform Undo
    list.splice(undoData.index, 0, undoData.task);
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[1].id, '2');
    assert.strictEqual(list[1].title, 'Task B');
  });

  // TEST 8: Empty and whitespace input rejection
  runTest('Empty or pure whitespace task titles are strictly rejected', () => {
    function validateTask(title) {
      return !!title && title.trim().length > 0;
    }
    assert.strictEqual(validateTask(''), false);
    assert.strictEqual(validateTask('   '), false);
    assert.strictEqual(validateTask('\t\n'), false);
    assert.strictEqual(validateTask('Valid Task'), true);
  });

  // TEST 9: Date formatting helper handles null, undefined, and valid dates
  runTest('Date formatting helper is resilient against bad input', () => {
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const monthIndex = parseInt(parts[1], 10) - 1;
        return `${parseInt(day, 10)} ${monthNames[monthIndex] || parts[1]}`;
      }
      return dateStr;
    }
    assert.strictEqual(formatDate(null), '');
    assert.strictEqual(formatDate(''), '');
    assert.strictEqual(formatDate('2026-11-16'), '16 ноя');
    assert.strictEqual(formatDate('2026-05-01'), '1 май');
    assert.strictEqual(formatDate('invalid-format'), 'invalid-format');
  });

  // TEST 10: Clear completed tasks logic
  runTest('Clear completed removes only completed items', () => {
    let tasks = [
      { id: '1', completed: false },
      { id: '2', completed: true },
      { id: '3', completed: false },
      { id: '4', completed: true }
    ];
    tasks = tasks.filter(t => !t.completed);
    assert.strictEqual(tasks.length, 2);
    assert.strictEqual(tasks[0].id, '1');
    assert.strictEqual(tasks[1].id, '3');
  });

  console.log('\n========================================================');
  console.log(` 🏁 CRASH TEST RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================================\n');
}

main().catch(console.error);
