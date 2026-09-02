import http.client
import json
import time

import sys

question = sys.argv[1] if len(sys.argv) > 1 else 'Why is Rosie portrayed as powerful?'
payload = json.dumps({
    'mode': 'artwork',
    'messages': [{'role': 'user', 'content': question}],
})
start = time.perf_counter()
conn = http.client.HTTPConnection('127.0.0.1', 4173, timeout=240)
conn.request('POST', '/api/chat', payload, {'Content-Type': 'application/json'})
response = conn.getresponse()
headers_at = time.perf_counter()
print(f'http={response.status} content_type={response.getheader("Content-Type")} headers={headers_at - start:.2f}s')
first = None
content = []
while True:
    line = response.readline()
    if not line:
        break
    decoded = line.decode('utf-8').strip()
    if not decoded.startswith('data:'):
        continue
    data = decoded[5:].strip()
    if data == '[DONE]':
        break
    event = json.loads(data)
    if event.get('delta'):
        if first is None:
            first = time.perf_counter()
        content.append(event['delta'])
end = time.perf_counter()
print(f'first_visible_sentence={(first - start) if first else None:.2f}s total={end - start:.2f}s')
print(''.join(content)[:500])
