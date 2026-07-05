import { OpenRouterProvider, DEFAULT_MODEL } from './openrouter.js';
import { OllamaProvider, DEFAULT_OLLAMA_MODEL } from './ollama.js';
import type { AIProvider } from './types.js';

let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_instance) return _instance;

  // Prefer Ollama if OLLAMA_API_URL is provided (local/on-prem)
  const ollamaUrl = process.env['OLLAMA_API_URL'];
  if (ollamaUrl) {
    _instance = new OllamaProvider(ollamaUrl, process.env['OLLAMA_DEFAULT_MODEL'] ?? DEFAULT_OLLAMA_MODEL);
    return _instance;
  }

  const apiKey = process.env['OPENROUTER_API_KEY'];
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set. Provide OLLAMA_API_URL for local Ollama or set OPENROUTER_API_KEY.');
  _instance = new OpenRouterProvider(apiKey, process.env['OPENROUTER_DEFAULT_MODEL'] ?? DEFAULT_MODEL);
  return _instance;
}

// Reset in tests
export function resetAIProvider(): void { _instance = null; }

export { DEFAULT_MODEL, JSON_MODEL, FREE_MODELS } from './openrouter.js';
export type { AIProvider, AIMessage, AIStreamChunk, AIGenerateOptions } from './types.js';
