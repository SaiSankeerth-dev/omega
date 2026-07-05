import { describe, it, expect } from 'vitest';
import { OllamaProvider } from '../providers/ollama.js';

// Mock a streaming response as a ReadableStream-like object
function makeStream(lines: string[]) {
  const encoder = new TextEncoder();
  const body = lines.join('\n');
  const arr = [encoder.encode(body)];
  let idx = 0;
  return {
    getReader() {
      return {
        read: async () => {
          if (idx >= arr.length) return { done: true, value: undefined };
          const v = arr[idx++];
          return { done: false, value: v };
        }
      };
    }
  } as any;
}

it('parses NDJSON streaming lines from Ollama', async () => {
  // Prepare mocked global.fetch
  const original = (global as any).fetch;
  (global as any).fetch = async (url: string, opts: any) => {
    return {
      ok: true,
      body: makeStream([
        JSON.stringify({ text: 'Hello' }),
        JSON.stringify({ text: ' world', done: true }),
      ]),
    } as any;
  };

  const prov = new OllamaProvider('http://localhost:11434', 'llama2');
  const chunks: string[] = [];
  for await (const c of prov.stream([{ role: 'user', content: 'hi' }], {})) {
    if (c.delta) chunks.push(c.delta);
    if (c.done) break;
  }

  (global as any).fetch = original;
  expect(chunks.join('')).toContain('Hello');
  expect(chunks.join('')).toContain('world');
});
