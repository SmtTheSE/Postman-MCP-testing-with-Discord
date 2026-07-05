with open('discord-mcp/tools/pan-mcp/discord-rest-api/unban-user-from-guild.js', 'r') as f:
    content = f.read()

import re
content = re.sub(r'const executeFunction = async \(\{ param, param \}\) => \{', r'const executeFunction = async ({ guild_id, user_id }) => {', content)
content = re.sub(r'return executeRequest\(requestDefinition, \{ param, param \}, collectionVariables\);', r'return executeRequest(requestDefinition, { guild_id, user_id }, collectionVariables);', content)

with open('discord-mcp/tools/pan-mcp/discord-rest-api/unban-user-from-guild.js', 'w') as f:
    f.write(content)
