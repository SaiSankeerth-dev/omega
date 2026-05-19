// Shared types for Omega

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Template types
export interface Template {
  id: string;
  name: string;
  description: string | null;
  content: Record<string, unknown>;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI history types
export interface AIHistoryEntry {
  id: string;
  userId: string;
  projectId: string | null;
  prompt: string;
  response: string;
  model: string;
  tokensUsed: number;
  createdAt: Date;
}

// Editor document types
export interface EditorDocument {
  id: string;
  projectId: string;
  content: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
