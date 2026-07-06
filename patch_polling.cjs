const fs = require('fs')
let polling = fs.readFileSync('src/hooks/useQueuePolling.ts', 'utf8')
// don't poll if we are live via SSE. Add an 'isSSELive' prop.
polling = polling.replace("isActive: boolean", "isActive: boolean\n    isSSELive?: boolean")
polling = polling.replace("if (!guildId || !channelId || !isActive) {", "if (!guildId || !channelId || !isActive || isSSELive) {")
fs.writeFileSync('src/hooks/useQueuePolling.ts', polling, 'utf8')
