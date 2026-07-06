const fs = require('fs')
let file = fs.readFileSync('src/hooks/useMusicStream.ts', 'utf8')
file = file.replace(/catch \(err\)/g, "catch")
fs.writeFileSync('src/hooks/useMusicStream.ts', file, 'utf8')
