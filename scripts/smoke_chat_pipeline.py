import http.client
import json
import time

CASES = [
    ('What is she holding?', 'rivet gun'),
    ('Is she standing?', 'seated'),
    ('Who painted this?', 'Norman Rockwell'),
    ('Is this the We Can Do It poster?', 'not J. Howard Miller'),
    ('Why is Rosie powerful?', 'powerful'),
]

for question, expected in CASES:
    started = time.perf_counter()
    conn = http.client.HTTPConnection('127.0.0.1', 4173, timeout=120)
    payload = json.dumps({'mode': 'artwork', 'messages': [{'role': 'user', 'content': question}]})
    conn.request('POST', '/api/chat', payload, {'Content-Type': 'application/json'})
    response = conn.getresponse()
    assert response.status == 200, f'{question}: HTTP {response.status}'
    assert 'text/event-stream' in (response.getheader('Content-Type') or ''), question
    events = []
    while True:
        line = response.readline()
        if not line:
            break
        text = line.decode().strip()
        if text.startswith('data:'):
            payload = text[5:].strip()
            events.append(payload)
            if payload == '[DONE]':
                break
    decoded = [json.loads(item) for item in events if item != '[DONE]']
    assert decoded and decoded[0].get('status') == 'thinking', question
    answer = ''.join(event.get('delta', '') for event in decoded)
    assert answer and expected.lower() in answer.lower(), f'{question}: {answer!r}'
    assert events[-1] == '[DONE]', question
    print(f'PASS {question!r}: {time.perf_counter() - started:.2f}s — {answer}')
