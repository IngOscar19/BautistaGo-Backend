export interface INotificationService {
  sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}
