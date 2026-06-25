const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/"gemini-3\.5-flash"/g, '"gemini-3.1-flash-lite"');
fs.writeFileSync('server.ts', code);
console.log('Replaced all gemini-3.5-flash with gemini-3.1-flash-lite');
