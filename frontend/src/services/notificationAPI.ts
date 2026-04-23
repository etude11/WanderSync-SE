import api from './api';

export interface NotificationItem {
  id: string;
  userId: string;
  eventId: string;
  channel: string;
  deliveredAt: string;
  success: boolean;
  read: boolean;
}

export const notificationAPI = {
  list: (page = 1, limit = 20) =>
    api.get<{ data: NotificationItem[]; total: number }>(`/notifications?page=${page}&limit=${limit}`),

  markRead: (id: string) =>
    api.patch<NotificationItem>(`/notifications/${id}/read`),
};
