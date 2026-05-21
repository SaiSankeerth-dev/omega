import type { AIGenerateOptions, AIMessage, AIProvider, AIStreamChunk } from './types.js';

export const FREE_MODELS = {
  LLAMA_3_70B:    'meta-llama/llama-3-70b-instruct:free',
  LLAMA_3_8B:     'meta-llama/llama-3-8b-instruct:free',
  DEEPSEEK_CHAT:  'deepseek/deepseek-chat:free',
  DEEPSEEK_R1:    'deepseek/deepseek-r1:free',
  GEMMA_27B:      'google/gemma-3-27b-it:free',
  MISTRAL_7B:     'mistralai/mistral-7b-instruct:free',
  QWEN_235B:      'qwen/qwen3-235b-a22b:free',
} as const;

// Best general model
export const DEFAULT_MODEL = FREE_MODELS.LLAMA_3_70B;
// Best for structured JSON output
export const JSON_MODEL = FREE_MODELS.DEEPSEEK_CHAT;

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  defaultModel: string;
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string, defaultModel?: string) {
    if (!apiKey) throw new Error('[OpenRouter] OPENROUTER_API_KEY is required. Get a free key at https://openrouter.ai');
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? DEFAULT_MODEL;
  }

  async *stream(messages: AIMessage[], options: AIGenerateOptions = {}): AsyncGenerator<AIStreamChunk> {
    const model = options.model ?? this.defaultModel;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
        }),
      });
    } catch (err) {
      yield { delta: '', done: true, error: 'Network error — check OPENROUTER_API_KEY and connectivity' };
      return;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      yield { delta: '', done: true, error: `OpenRouter ${response.status}: ${body}` };
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        if (trimmed === 'data: [DONE]') { yield { delta: '', done: true }; return; }
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content ?? '';
          const finished = json.choices?.[0]?.finish_reason === 'stop';
          yield { delta, done: finished, model: json.model };
          if (finished) return;
        } catch { /* malformed chunk, skip */ }
      }
    }
    yield { delta: '', done: true };
  }

  async generate(messages: AIMessage[], options: AIGenerateOptions = {}): Promise<string> {
    const model = options.model ?? JSON_MODEL;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      throw new Error(`OpenRouter ${response.status}: ${body}`);
    }
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content ?? '';
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': process.env['APP_URL'] ?? 'http://localhost:3000',
      'X-Title': 'Omega AI Platform',
    };
  }
}
