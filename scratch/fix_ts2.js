const fs = require('fs');

const fileFixes = {
  'apps/api/src/modules/admin/admin.controller.ts': [
    { line: 23, replace: 'role as string' },
    { line: 40, replace: 'id' },
    { line: 81, replace: 'status as string' },
    { line: 104, replace: 'id' },
  ],
  'apps/api/src/modules/bookings/bookings.controller.ts': [
    { line: 222, replace: 'id' },
    { line: 273, replace: 'id' },
  ],
  'apps/api/src/modules/notifications/notifications.controller.ts': [
    { line: 31, replace: 'id' },
  ],
  'apps/api/src/modules/owner/owner.controller.ts': [
    { line: 19, replace: 'id' },
  ],
  'apps/api/src/modules/social/social.controller.ts': [
    { line: 59, replace: 'id' },
    { line: 69, replace: 'id' },
    { line: 225, replace: 'id' },
    { line: 242, replace: 'id' },
    { line: 259, replace: 'id' },
    { line: 282, replace: 'id' },
    { line: 331, replace: 'id' },
    { line: 348, replace: 'id' },
    { line: 371, replace: 'id' },
    { line: 381, replace: 'id' },
    { line: 407, replace: 'id' },
    { line: 417, replace: 'id' },
  ],
  'apps/api/src/modules/watchparty/watchparty.controller.ts': [
    { line: 42, replace: 'id' },
    { line: 59, replace: 'id' },
    { line: 82, replace: 'id' },
    { line: 92, replace: 'id' },
    { line: 115, replace: 'id' },
    { line: 125, replace: 'id' },
    { line: 210, replace: 'id' },
  ]
};

for (const [file, fixes] of Object.entries(fileFixes)) {
  const filePath = `c:/Users/srija/OneDrive/Desktop/Cinebook/${file}`;
  if (fs.existsSync(filePath)) {
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const fix of fixes) {
      // Very naive approach: replace id or status with as string
      // Just append `as string` to everything that is problematic.
      // Wait, it's easier to just do `as string` on the variables themselves.
      // Let's just find the `const { id } = req.params;` and change it to `const id = req.params.id as string;`
      let lineText = lines[fix.line - 1];
      if (lineText.includes('id,')) {
        lines[fix.line - 1] = lineText.replace('id,', 'id as string,');
      } else if (lineText.includes('id)')) {
        lines[fix.line - 1] = lineText.replace('id)', 'id as string)');
      } else if (lineText.includes('(id')) {
        lines[fix.line - 1] = lineText.replace('(id', '(id as string');
      } else if (lineText.includes('status)')) {
        lines[fix.line - 1] = lineText.replace('status)', 'status as string)');
      } else if (lineText.includes('role)')) {
        lines[fix.line - 1] = lineText.replace('role)', 'role as string)');
      }
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
}
