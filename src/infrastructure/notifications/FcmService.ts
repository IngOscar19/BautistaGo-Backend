import admin from 'firebase-admin';
import type { INotificationService } from '../../domain/interfaces';

export class FcmService implements INotificationService {
  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    try {
      if (!admin.apps.length) {
        console.warn('Firebase Admin no está inicializado. No se enviará la notificación push.');
        return;
      }

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data ?? {},
      });
    } catch (error) {
      console.error('Error al enviar notificación push con FCM:', error);
    }
  }
}
