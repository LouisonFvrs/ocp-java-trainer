// Checks every content file against the data contract.
// Usage: node tools/validate.js [file.js ...]   (no argument = all files in js/data)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'js', 'data');
const files = process.argv.length > 2
  ? process.argv.slice(2).map((f) => path.resolve(f))
  : fs.readdirSync(dataDir).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(dataDir, f));

const sandbox = { String, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'registry.js'), 'utf8'), sandbox);

const errors = [];
const ids = new Set();
const BLOCK_KEYS = ['h', 'p', 'list', 'code', 'trap', 'tip', 'table'];
const POSITIONAL = /\b(all|none) of the above\b|\b(both )?[A-F] and [A-F]\b|\boption [A-F]\b|\banswers? [A-F]\b/i;

function checkCourse(file, sections) {
  sections.forEach((section, i) => {
    const where = `${file} course[${i}]`;
    if (!section.title || typeof section.title !== 'string') errors.push(`${where}: missing title`);
    if (!Array.isArray(section.blocks) || !section.blocks.length) return errors.push(`${where}: missing blocks`);
    section.blocks.forEach((block, j) => {
      const keys = Object.keys(block);
      if (keys.length !== 1 || !BLOCK_KEYS.includes(keys[0])) return errors.push(`${where} block[${j}]: must have exactly one key among ${BLOCK_KEYS.join(', ')}`);
      const value = block[keys[0]];
      if (keys[0] === 'list' && !(Array.isArray(value) && value.every((v) => typeof v === 'string'))) errors.push(`${where} block[${j}]: list must be an array of strings`);
      else if (keys[0] === 'table' && !(value && Array.isArray(value.head) && Array.isArray(value.rows) && value.rows.every((r) => Array.isArray(r) && r.length === value.head.length))) errors.push(`${where} block[${j}]: table needs head[] and rows[][] of the same width`);
      else if (!['list', 'table'].includes(keys[0]) && typeof value !== 'string') errors.push(`${where} block[${j}]: ${keys[0]} must be a string`);
    });
  });
}

function checkQuestion(file, prefix, q, i) {
  const where = `${file} ${q && q.id ? q.id : 'questions[' + i + ']'}`;
  if (!q.id || !new RegExp('^' + prefix + '-\\d{3}$').test(q.id)) errors.push(`${where}: id must match ${prefix}-NNN`);
  if (ids.has(q.id)) errors.push(`${where}: duplicate id`);
  ids.add(q.id);
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${where}: difficulty must be 1, 2 or 3`);
  if (typeof q.q !== 'string' || q.q.length < 10) errors.push(`${where}: missing question text`);
  if (q.code !== undefined && (typeof q.code !== 'string' || !q.code.trim())) errors.push(`${where}: code must be a non-empty string`);
  if (!Array.isArray(q.options) || q.options.length < 4 || q.options.length > 7) return errors.push(`${where}: 4 to 7 options required`);
  if (new Set(q.options).size !== q.options.length) errors.push(`${where}: duplicate options`);
  q.options.forEach((o) => {
    if (typeof o !== 'string' || !o.trim()) errors.push(`${where}: empty option`);
    else if (POSITIONAL.test(o)) errors.push(`${where}: option refers to other options by position ("${o}") but options are shuffled`);
  });
  if (!Array.isArray(q.answer) || !q.answer.length || q.answer.length >= q.options.length) errors.push(`${where}: answer must list 1..n-1 option indexes`);
  else if (q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length) || new Set(q.answer).size !== q.answer.length) errors.push(`${where}: invalid answer indexes`);
  if (Array.isArray(q.answer) && q.answer.length > 1 && !/choose (two|three|four)/i.test(q.q)) errors.push(`${where}: multi-answer question must say "(Choose two.)" / "(Choose three.)"`);
  if (typeof q.explain !== 'string' || q.explain.length < 60) errors.push(`${where}: explanation too short`);
}

let total = 0;
for (const file of files) {
  const name = path.basename(file);
  const prefix = name.replace(/\.js$/, '');
  const before = sandbox.OCP.register;
  sandbox.OCP.register = (part) => {
    checkCourse(name, part.course || []);
    (part.questions || []).forEach((q, i) => checkQuestion(name, prefix, q, i));
    total += (part.questions || []).length;
    before(part);
  };
  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: name });
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
  }
  sandbox.OCP.register = before;
}

for (const t of sandbox.OCP.topics) {
  console.log(`${String(t.n).padStart(2)}. ${t.id.padEnd(12)} ${String(t.questions.length).padStart(3)} questions, ${t.course.length} course sections`);
}
console.log(`Total: ${total} questions`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('OK');
