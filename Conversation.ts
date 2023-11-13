export interface Message {
  role: 'user' | 'assistant' | 'system' | 'function';
  name?: string;
  content: string;
}

export type Conversation = Message[];


