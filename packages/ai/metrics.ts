type Metrics = {
  providerCalls: number;
  providerErrors: number;
  providerFallbacks: number;
};

export const metrics: Metrics = {
  providerCalls: 0,
  providerErrors: 0,
  providerFallbacks: 0,
};

export function incProviderCall() { metrics.providerCalls++; }
export function incProviderError() { metrics.providerErrors++; }
export function incProviderFallback() { metrics.providerFallbacks++; }

export function snapshot() { return { ...metrics }; }
