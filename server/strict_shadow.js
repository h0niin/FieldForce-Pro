const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/Litty Mathew Irimpan/FieldForce-Pro/server/src', function(filePath) {
  if (filePath.endsWith('.controller.ts')) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    let dynamicLine = -1;
    let method = '';
    
    for (let i = 0; i < lines.length; i++) {
      let match = lines[i].match(/@(Get|Post|Put|Patch|Delete)\(':id'\)/);
      if (match) {
        dynamicLine = i;
        method = match[1];
      } else if (dynamicLine > -1) {
        let staticMatch = lines[i].match(new RegExp(`@${method}\\(['"]([a-zA-Z0-9_-]+)['"]\\)`));
        if (staticMatch) {
          console.log('Shadowing found in: ' + filePath + ' at line ' + (i+1) + ': ' + staticMatch[0]);
        }
      }
    }
  }
});
