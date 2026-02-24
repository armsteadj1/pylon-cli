export interface OutputOptions {
  json?: boolean;
  csv?: boolean;
}

export interface Issue {
  id: string;
  ticketNumber?: number;
  title?: string;
  state?: string;
  createdAt?: string;
  updatedAt?: string;
  assignee?: { id: string; name?: string; displayName?: string };
  account?: { id: string; name?: string };
  priority?: string;
}

export interface Account {
  id: string;
  name?: string;
  domain?: string;
  createdAt?: string;
  updatedAt?: string;
  tier?: string;
  mrr?: number;
  arr?: number;
}

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  account?: { id: string; name?: string };
  createdAt?: string;
}

export interface FeatureRequest {
  id: string;
  title?: string;
  status?: string;
  revenue?: number;
  accountCount?: number;
  createdAt?: string;
}

export interface Task {
  id: string;
  title?: string;
  status?: string;
  dueDate?: string;
  assignee?: { id: string; name?: string; displayName?: string };
  account?: { id: string; name?: string };
  createdAt?: string;
}

export interface KBArticle {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  message?: string;
}

export interface Announcement {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
}

export interface User {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
}

export interface View {
  id: string;
  name?: string;
  objectType?: string;
  isDefault?: boolean;
}
