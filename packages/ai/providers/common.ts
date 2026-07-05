export async function callWithRetries<T>(fn: () => Promise<T>, attempts = 3, backoffMs = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      // If auth error, don't retry
      const msg = String(err?.message ?? '');
      if (/401|invalid api key|invalid token/i.test(msg)) throw err;
      const wait = backoffMs * Math.pow(2, i);
      await new Promise(res => setTimeout(res, wait));
    }
  }
  throw lastErr;
}
