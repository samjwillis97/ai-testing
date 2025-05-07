const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'packages/cli/tests/utils/output.test.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicate quiet properties
content = content.replace(/quiet: false,\s+quiet: false,/g, 'quiet: false,');

// Update test descriptions
content = content.replace(/should return formatted data when silent is true/g, 'should return formatted data when quiet is true');
content = content.replace(/should not print when silent is true/g, 'should not print when quiet is true');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);
console.log('Fixed output.test.ts');
