export interface AIMessageModel {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AISessionModel {
  id: string;
  title: string;
  updatedAt: string;
}
