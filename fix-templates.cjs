const fs = require('fs');
let content = fs.readFileSync('C:\\Users\\Ishaan Nandoskar\\dev\\cic-club\\backend\\routes\\compiler_new.js', 'utf8');

// Find the corrupted templates endpoint and fix it
const startIdx = content.indexOf('/** GET /api/compiler/templates');
if (startIdx !== -1) {
  const endIdx = content.indexOf('export default router;', startIdx);
  if (endIdx !== -1) {
    const newEnding = `/** GET /api/compiler/templates */\nrouter.get('/templates', protect, (req, res) => {\n  res.json(STARTER_TEMPLATES);\n});\n\nexport default router;`;
    content = content.substring(0, startIdx) + newEnding;
    fs.writeFileSync('C:\\Users\\Ishaan Nandoskar\\dev\\cic-club\\backend\\routes\\compiler_new.js', content);
    console.log('Fixed');
  }
}