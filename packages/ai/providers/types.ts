export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number };
  error?: string;
}

export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: string;
  defaultModel: string;
  stream(messages: AIMessage[], options?: AIGenerateOptions): AsyncGenerator<AIStreamChunk>;
  generate(messages: AIMessage[], options?: AIGenerateOptions): Promise<string>;
}
