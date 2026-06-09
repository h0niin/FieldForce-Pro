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
    const content = fs.readFileSync(filePath, 'utf8');
    const getRoutes = [];
    const regex = /@(Get|Post|Put|Patch|Delete)\((['"][^'"]*['"])?\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      getRoutes.push({ method: match[1], path: match[2] ? match[2].replace(/['"]/g, '') : '' });
    }
    
    let hasDynamic = {}; // Map of "method:numSegments" -> true
    let shadowed = [];
    for (let route of getRoutes) {
      const { method, path: routePath } = route;
      const numSegments = routePath.split('/').length;
      const key = method + ':' + numSegments;
      
      const firstSegment = routePath.split('/')[0];
      
      // If the first segment is dynamic, it will shadow any other route with the same number of segments
      if (firstSegment.startsWith(':')) {
        hasDynamic[key] = true;
      } else if (hasDynamic[key] && !routePath.includes(':') && routePath !== '') {
        shadowed.push(`[${method}] /${routePath}`);
      }
    }
    
    if (shadowed.length > 0) {
      console.log('Shadowing found in: ' + filePath);
      console.log('Shadowed routes: ' + shadowed.join(', '));
    }
  }
});
