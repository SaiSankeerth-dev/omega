import { useAIStore } from '../../../../store/ai';
import type { AIMessage, GeneratedPresentation } from '../../../../store/ai';

// Re-export the root store with full backend support
export { useAIStore };
export type { AIMessage, GeneratedPresentation };
