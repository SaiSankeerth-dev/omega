import { getAIProvider } from './providers/index.js';

export async function providerHealth(): Promise<{ provider: string; ok: boolean; error?: string }> {
  try {
    const p = getAIProvider();
    // attempt a lightweight call if provider exposes ping
    // fallback: consider provider available if constructed
    return { provider: p.name, ok: true };
  } catch (err: any) {
    return { provider: 'none', ok: false, error: String(err?.message ?? err) };
  }
}
