'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseYmd(text) {
  if (text instanceof Date) {
    return {
      y: text.getFullYear(),
      m: text.getMonth() + 1,
      d: text.getDate()
    };
  }
  const s = String(text).trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!m) throw new Error('日期格式应为 YYYY-MM-DD，收到：' + s);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new Error('无效日期：' + s);
  }
  return { y, m: mo, d };
}

function ymd(obj) {
  return `${obj.y}-${pad2(obj.m)}-${pad2(obj.d)}`;
}

function dateKey(obj) {
  return `${obj.y}${pad2(obj.m)}${pad2(obj.d)}`;
}

function addDays(obj, delta) {
  const dt = new Date(Date.UTC(obj.y, obj.m - 1, obj.d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function diffDays(a, b) {
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((da - db) / 86400000);
}

function eachDay(start, end, limit) {
  const list = [];
  const max = limit == null ? 3660 : limit;
  let cur = { ...start };
  while (diffDays(end, cur) >= 0 && list.length < max) {
    list.push(cur);
    cur = addDays(cur, 1);
  }
  return list;
}

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round(n, digits) {
  const p = Math.pow(10, digits == null ? 0 : digits);
  return Math.round(n * p) / p;
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function signPayload(payload) {
  return sha256(canonicalJson(payload));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return file;
}

function unique(list) {
  return Array.from(new Set(list));
}

function includesAny(haystack, needles) {
  if (!Array.isArray(haystack)) return [];
  const set = new Set(haystack);
  return needles.filter((n) => set.has(n));
}

function countMatches(haystack, needles) {
  return includesAny(haystack, needles).length;
}

function formatDateCn(date) {
  return `${date.y}年${date.m}月${date.d}日`;
}

module.exports = {
  pad2,
  parseYmd,
  ymd,
  dateKey,
  addDays,
  diffDays,
  eachDay,
  dayOfYear,
  clamp,
  round,
  canonicalJson,
  sha256,
  signPayload,
  ensureDir,
  readJson,
  writeJson,
  unique,
  includesAny,
  countMatches,
  formatDateCn
};