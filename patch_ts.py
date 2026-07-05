with open('src/hooks/useChannelWizard.ts', 'r') as f:
    content = f.read()

content = content.replace("  const updateField = useCallback((field: string, value: string | number) => {\n    setState((prev) => ({ ...prev, [field]: value }))\n  }, [])", "  const updateField = useCallback((field: string, value: string | number | boolean) => {\n    setState((prev) => ({ ...prev, [field]: value }))\n  }, [])")

with open('src/hooks/useChannelWizard.ts', 'w') as f:
    f.write(content)

with open('src/components/Step2VoiceSettings.tsx', 'r') as f:
    content = f.read()
content = content.replace("onUpdate: (field: string, value: number | string) => void", "onUpdate: (field: string, value: number | string | boolean) => void")
with open('src/components/Step2VoiceSettings.tsx', 'w') as f:
    f.write(content)
