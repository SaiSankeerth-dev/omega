import { describe, it, expect } from 'vitest';
import { resetAIProvider, getAIProvider } from '../providers/index.js';

describe('AI providers integration smoke', () => {
  it('constructs a provider when OLLAMA_API_URL present', () => {
    process.env.OLLAMA_API_URL = 'http://localhost:11434';
    resetAIProvider();
    const p = getAIProvider();
    expect(p).toBeDefined();
    expect(['ollama','openrouter']).toContain(p.name);
    delete process.env.OLLAMA_API_URL;
    resetAIProvider();
  });

  it('falls back to OpenRouter when configured', () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    resetAIProvider();
    const p = getAIProvider();
    expect(p).toBeDefined();
    expect(p.name).toBe('openrouter');
    delete process.env.OPENROUTER_API_KEY;
    resetAIProvider();
  });
});
