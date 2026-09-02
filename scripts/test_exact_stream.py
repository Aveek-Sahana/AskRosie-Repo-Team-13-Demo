import http.client
import json
import time

import sys

question = sys.argv[1] if len(sys.argv) > 1 else 'What is she holding?'
payload = json.dumps({'mode': 'artwork', 'messages': [{'role': 'user', 'content': question}]})
conn = http.client.HTTPConnection('127.0.0.1', 4173, timeout=240)
conn.request('POST', '/api/chat', payload, {'Content-Type': 'application/json'})
response = conn.getresponse()
print(f'http={response.status} content_type={response.getheader("Content-Type")}')
events = []
while True:
    line = response.readline()
    if not line:
        break
    text = line.decode('utf-8').strip()
    if text.startswith('data:'):
        events.append(text[5:].strip())
        if events[-1] == '[DONE]':
            break
print(json.dumps(events, indent=2)[:6000])
