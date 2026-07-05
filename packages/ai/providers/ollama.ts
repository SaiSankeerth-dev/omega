import type { AIProvider, AIMessage, AIStreamChunk, AIGenerateOptions } from './types.js';

export const DEFAULT_OLLAMA_MODEL = 'llama2';

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  defaultModel: string;
  private baseUrl: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl ?? process.env['OLLAMA_API_URL'] ?? 'http://localhost:11434';
    this.defaultModel = defaultModel ?? process.env['OLLAMA_DEFAULT_MODEL'] ?? DEFAULT_OLLAMA_MODEL;
  }

  // Ollama returns streaming NDJSON when stream: true — implement a resilient streamer
  async *stream(messages: AIMessage[], options: AIGenerateOptions = {}): AsyncGenerator<AIStreamChunk> {
    const model = options.model ?? this.defaultModel;
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: true, max_tokens: options.maxTokens ?? 2048, temperature: options.temperature ?? 0.7 }),
      });
    } catch (err) {
      yield { delta: '', done: true, error: 'Network error contacting Ollama (is the server running?)' };
      return;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      yield { delta: '', done: true, error: `Ollama ${response.status}: ${body}` };
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Ollama streams NDJSON lines; split on newlines
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Each line is JSON or plain text; try parse
        try {
          const json = JSON.parse(trimmed);
          // schema varies; attempt to extract text fields
          const delta = json?.text ?? json?.response ?? '';
          const doneFlag = json?.done === true || json?.stop === true;
          yield { delta, done: doneFlag };
          if (doneFlag) return;
        } catch {
          // not JSON — emit raw text
          yield { delta: trimmed, done: false };
        }
      }
    }
    if (buffer) {
      yield { delta: buffer, done: true };
      return;
    }
    yield { delta: '', done: true };
  }

  async generate(messages: AIMessage[], options: AIGenerateOptions = {}): Promise<string> {
    const model = options.model ?? this.defaultModel;
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, max_tokens: options.maxTokens ?? 2048, temperature: options.temperature ?? 0.3 }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      throw new Error(`Ollama ${response.status}: ${body}`);
    }
    const json = await response.json().catch(() => null) as any;
    // Try several common fields
    if (!json) return '';
    if (typeof json === 'string') return json;
    if (json.response) return json.response;
    if (json.text) return json.text;
    if (Array.isArray(json) && json.length) return String(json.map(x => x.text ?? JSON.stringify(x)).join('\n'));
    // Fallback: stringify
    return JSON.stringify(json);
  }
}
