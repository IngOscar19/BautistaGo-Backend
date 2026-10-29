export interface MulticastResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export interface INotificationService {
  sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
  sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<MulticastResult>;
  sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
  subscribeToTopic(token: string | string[], topic: string): Promise<void>;
  unsubscribeFromTopic?(token: string | string[], topic: string): Promise<void>;
}
