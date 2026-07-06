const fs = require('fs')
let service = fs.readFileSync('lib/music/service.js', 'utf8')
service = service.replace(/\[\\\(\\\[\].\*\?\[\\\)\]\]/g, '\\[\\(\\[\\].*?\\[\\)\\]\\]')
fs.writeFileSync('lib/music/service.js', service, 'utf8')
