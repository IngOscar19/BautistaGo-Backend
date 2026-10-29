import admin from 'firebase-admin';
import type { INotificationService, MulticastResult } from '../../domain/interfaces';
import { logger } from '../../shared/logger';

export class FcmService implements INotificationService {
  private isInitialized(): boolean {
    if (!admin.apps || admin.apps.length === 0) {
      logger.warn('Firebase Admin no está inicializado. No se enviará la notificación push.');
      return false;
    }
    return true;
  }

  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    try {
      if (!this.isInitialized()) return;
      if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
        logger.warn('Token FCM no provisto o inválido para sendPush');
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

      logger.info('Notificación push FCM enviada con éxito', { title });
    } catch (error: any) {
      if (
        error?.code === 'messaging/registration-token-not-registered' ||
        error?.code === 'messaging/invalid-registration-token'
      ) {
        logger.warn('Token FCM inválido o no registrado al enviar notificación push', {
          token: fcmToken,
          code: error.code,
        });
        return;
      }

      logger.error('Error al enviar notificación push con FCM', { error });
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<MulticastResult> {
    const defaultResult: MulticastResult = { successCount: 0, failureCount: 0, invalidTokens: [] };

    try {
      if (!this.isInitialized()) return defaultResult;
      if (!tokens || tokens.length === 0) {
        logger.warn('Lista de tokens vacía en sendMulticast');
        return defaultResult;
      }

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
        data: data ?? {},
      });

      const invalidTokens: string[] = [];
      response.responses.forEach((resp, index) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        logger.warn('Tokens FCM inválidos o no registrados detectados en multicast', {
          count: invalidTokens.length,
          invalidTokens,
        });
      }

      logger.info('Notificación multicast FCM procesada', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokensCount: invalidTokens.length,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      logger.error('Error al enviar notificación multicast con FCM', { error });
      return defaultResult;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    try {
      if (!this.isInitialized()) return;
      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        logger.warn('Topic no provisto o inválido en sendToTopic');
        return;
      }

      await admin.messaging().send({
        topic,
        notification: {
          title,
          body,
        },
        data: data ?? {},
      });

      logger.info('Notificación push FCM enviada al topic', { topic, title });
    } catch (error) {
      logger.error(`Error al enviar notificación push al topic "${topic}" con FCM`, { error });
    }
  }

  async subscribeToTopic(tokenOrTokens: string | string[], topic: string): Promise<void> {
    try {
      if (!this.isInitialized()) return;
      if (!topic) {
        logger.warn('Topic no provisto en subscribeToTopic');
        return;
      }

      const response = await admin.messaging().subscribeToTopic(tokenOrTokens, topic);
      if (response.failureCount > 0) {
        logger.warn(`Hubo ${response.failureCount} fallos al suscribir tokens al topic "${topic}"`, {
          errors: response.errors,
        });
      } else {
        logger.info(`Tokens suscritos exitosamente al topic "${topic}"`, { successCount: response.successCount });
      }
    } catch (error) {
      logger.error(`Error al suscribir al topic "${topic}" con FCM`, { error });
    }
  }

  async unsubscribeFromTopic(tokenOrTokens: string | string[], topic: string): Promise<void> {
    try {
      if (!this.isInitialized()) return;
      if (!topic) {
        logger.warn('Topic no provisto en unsubscribeFromTopic');
        return;
      }

      const response = await admin.messaging().unsubscribeFromTopic(tokenOrTokens, topic);
      if (response.failureCount > 0) {
        logger.warn(`Hubo ${response.failureCount} fallos al desuscribir tokens del topic "${topic}"`, {
          errors: response.errors,
        });
      } else {
        logger.info(`Tokens desuscritos exitosamente del topic "${topic}"`, { successCount: response.successCount });
      }
    } catch (error) {
      logger.error(`Error al desuscribir del topic "${topic}" con FCM`, { error });
    }
  }
}
