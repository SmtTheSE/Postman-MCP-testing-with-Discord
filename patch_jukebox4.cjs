const fs = require('fs')

let useQueuePolling = fs.readFileSync('src/hooks/useQueuePolling.ts', 'utf8')
useQueuePolling = useQueuePolling.replace("import { useEffect, useRef } from 'react'", "import { useEffect, useRef } from 'react'\nimport type { MusicQueueStatus } from '../services/discordApi'")
useQueuePolling = useQueuePolling.replace("import { discordApi, type MusicQueueStatus } from '../services/discordApi'", "import { discordApi } from '../services/discordApi'")
fs.writeFileSync('src/hooks/useQueuePolling.ts', useQueuePolling, 'utf8')

let tsconfig = fs.readFileSync('tsconfig.json', 'utf8')
tsconfig = tsconfig.replace('"verbatimModuleSyntax": true', '"verbatimModuleSyntax": false')
fs.writeFileSync('tsconfig.json', tsconfig, 'utf8')

let appTsconfig = fs.readFileSync('tsconfig.app.json', 'utf8')
appTsconfig = appTsconfig.replace('"verbatimModuleSyntax": true', '"verbatimModuleSyntax": false')
fs.writeFileSync('tsconfig.app.json', appTsconfig, 'utf8')

let nodeTsconfig = fs.readFileSync('tsconfig.node.json', 'utf8')
nodeTsconfig = nodeTsconfig.replace('"verbatimModuleSyntax": true', '"verbatimModuleSyntax": false')
fs.writeFileSync('tsconfig.node.json', nodeTsconfig, 'utf8')
