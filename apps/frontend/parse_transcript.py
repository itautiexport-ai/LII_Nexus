import json
with open('/Users/bci/.gemini/antigravity-ide/brain/7657834f-5b13-4fc5-bbc6-6e05c7eb3c87/.system_generated/logs/transcript.jsonl') as f:
    for line in f:
        data = json.loads(line)
        if 'content' in data and 'AdminLayout.tsx' in data['content']:
            print(data['content'][:500]) # preview to see where the content is
