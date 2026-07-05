with open('lib/createChannel.js', 'r') as f:
    content = f.read()

content = content.replace("} catch (err) {\n        // Continue if category creation fails", "} catch (_err) {\n        // Continue if category creation fails")
content = content.replace("} catch (err) {\n        // Continue if text channel creation fails", "} catch (_err) {\n        // Continue if text channel creation fails")

with open('lib/createChannel.js', 'w') as f:
    f.write(content)
