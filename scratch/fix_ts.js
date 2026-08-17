const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/srija/OneDrive/Desktop/Cinebook/apps/api/src', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix req.user?.id -> req.user!.id
    content = content.replace(/req\.user\?\.id/g, 'req.user!.id');
    
    // taste.service.ts
    // src/modules/social/taste.service.ts(55,23): error TS2532: Object is possibly 'undefined'.
    if (filePath.includes('taste.service.ts')) {
      content = content.replace(/movie\.genres/g, 'movie?.genres');
      content = content.replace(/tasteProfile\.genres/g, 'tasteProfile!.genres');
    }
    
    // watchparty.service.ts
    if (filePath.includes('watchparty.service.ts')) {
      content = content.replace(/group\.showId/g, 'group!.showId');
      content = content.replace(/group\.id/g, 'group!.id');
      content = content.replace(/group\.status/g, 'group!.status');
      content = content.replace(/existingParty\.show/g, 'existingParty!.show');
    }
    
    // core-logic.test.ts
    if (filePath.includes('core-logic.test.ts')) {
      content = content.replace(/expect\(res\.body\.data/g, 'expect(res.body!.data');
      content = content.replace(/expect\(movieResult\.data/g, 'expect(movieResult!.data');
      content = content.replace(/expect\(bookingResult\.data/g, 'expect(bookingResult!.data');
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
