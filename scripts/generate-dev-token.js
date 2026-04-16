#!/usr/bin/env node

const ACCESS_TOKEN_STORAGE_KEY = 'team-bemg-access-token';

const role = process.argv[2];
const subject = process.argv[3] || `local-${role || 'user'}`;

const base64UrlEncode = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const printClearInstructions = () => {
  console.log('Clear token in browser DevTools console:');
  console.log('');
  console.log(`localStorage.removeItem('${ACCESS_TOKEN_STORAGE_KEY}');`);
  console.log('location.reload();');
};

if (!role || !['admin', 'user', 'clear'].includes(role)) {
  console.log('Usage:');
  console.log('  node scripts/generate-dev-token.js admin [subject]');
  console.log('  node scripts/generate-dev-token.js user [subject]');
  console.log('  node scripts/generate-dev-token.js clear');
  process.exit(1);
}

if (role === 'clear') {
  printClearInstructions();
  process.exit(0);
}

const payload = {
  sub: subject,
  role,
  exp: 9999999999,
};

const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const body = base64UrlEncode(JSON.stringify(payload));
const signature = 'dev-signature';
const token = `${header}.${body}.${signature}`;

console.log(`Generated ${role} dev token:`);
console.log('');
console.log(token);
console.log('');
console.log('Set token in browser DevTools console:');
console.log('');
console.log(`localStorage.setItem('${ACCESS_TOKEN_STORAGE_KEY}', '${token}');`);
console.log('location.reload();');
