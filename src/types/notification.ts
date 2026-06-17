export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UnreadCountResponse = {
  unreadCount: number;
};

export type RegisterPushTokenBody = {
  token: string;
  provider: "fcm" | "expo";
  platform: "ios" | "android" | "web";
  deviceId?: string;
};

export type RemovePushTokenBody = {
  token?: string;
};
