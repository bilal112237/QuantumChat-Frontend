import type { ApiResponse, PaginatedResponse, IConversation, IMessage, IUser, IAttachment, WebsiteBranding, WebsiteSettings } from '@quantum-chat/shared';

export class ApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private token: string | null = null
  ) {}

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${this.baseUrl}/api/v1${path}`, { ...options, headers });
    let data: ApiResponse<T>;
    try {
      data = await res.json();
    } catch {
      throw new Error(res.ok ? 'Invalid server response' : `Request failed (${res.status})`);
    }
    if (!res.ok || !data.success) throw new Error(data.error || `Request failed (${res.status})`);
    return data.data as T;
  }

  async widgetAuth(user: { email: string; displayName: string; externalId?: string; avatarUrl?: string }) {
    return this.request<{ user: IUser; token: string; website: { name: string; branding: WebsiteBranding; settings: WebsiteSettings } }>(
      '/auth/widget',
      { method: 'POST', body: JSON.stringify(user) }
    );
  }

  async getWebsiteConfig() {
    return this.request<{
      websiteId: string;
      name: string;
      branding: WebsiteBranding;
      settings: WebsiteSettings;
    }>('/websites/config');
  }

  async getMe() {
    return this.request<IUser>('/auth/me');
  }

  async getConversations(page = 1) {
    return this.request<PaginatedResponse<IConversation>>(`/conversations?page=${page}`);
  }

  async createConversation(participantId: string) {
    return this.request<IConversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  async searchUsers(q: string) {
    return this.request<PaginatedResponse<IUser>>(`/users/search?q=${encodeURIComponent(q)}`);
  }

  async searchConversations(q: string) {
    return this.request<IConversation[]>(`/conversations/search?q=${encodeURIComponent(q)}`);
  }

  async getMessages(conversationId: string, page = 1) {
    return this.request<PaginatedResponse<IMessage>>(
      `/conversations/${conversationId}/messages?page=${page}`
    );
  }

  async sendMessage(data: { conversationId: string; content: string; replyTo?: string; attachmentIds?: string[] }) {
    return this.request<IMessage>('/messages', { method: 'POST', body: JSON.stringify(data) });
  }

  async editMessage(id: string, content: string) {
    return this.request<IMessage>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });
  }

  async deleteMessage(id: string) {
    return this.request<IMessage>(`/messages/${id}`, { method: 'DELETE' });
  }

  async reactMessage(id: string, emoji: string) {
    return this.request<IMessage>(`/messages/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) });
  }

  async markRead(conversationId: string, messageIds?: string[]) {
    return this.request(`/conversations/${conversationId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    });
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/conversations/unread');
  }

  async uploadFile(file: File, meta?: {
    isEncrypted: boolean;
    encryptionIv: string;
    originalMimeType: string;
    encryptedOriginalName: string;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.isEncrypted) {
      formData.append('isEncrypted', 'true');
      formData.append('encryptionIv', meta.encryptionIv);
      formData.append('originalMimeType', meta.originalMimeType);
      formData.append('encryptedOriginalName', meta.encryptedOriginalName);
    }
    const headers: Record<string, string> = { 'X-Api-Key': this.apiKey };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${this.baseUrl}/api/v1/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data: ApiResponse<IAttachment> = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.data!;
  }
}
