import admin from 'firebase-admin';
import { FcmService } from '../FcmService';
import { logger } from '../../../shared/logger';

const sendMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const subscribeToTopicMock = jest.fn();
const unsubscribeFromTopicMock = jest.fn();

jest.mock('firebase-admin', () => {
  return {
    apps: [],
    messaging: jest.fn(() => ({
      send: sendMock,
      sendEachForMulticast: sendEachForMulticastMock,
      subscribeToTopic: subscribeToTopicMock,
      unsubscribeFromTopic: unsubscribeFromTopicMock,
    })),
  };
});

describe('FcmService', () => {
  let fcmService: FcmService;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    fcmService = new FcmService();
    // Iniciar con Firebase inicializado por defecto
    (admin.apps as any) = [{ name: 'bautista-app' }];
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    loggerInfoSpy.mockRestore();
  });

  describe('sendPush', () => {
    it('Firebase no inicializado → emite warning y no lanza error', async () => {
      (admin.apps as any) = [];

      await expect(
        fcmService.sendPush('fake-token', 'Título', 'Cuerpo')
      ).resolves.not.toThrow();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin no está inicializado')
      );
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('Token inválido o vacío → emite warning y no llama a Firebase', async () => {
      await fcmService.sendPush('', 'Título', 'Cuerpo');

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token FCM no provisto o inválido')
      );
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('sendPush exitoso → llama a messaging().send() con parámetros correctos', async () => {
      sendMock.mockResolvedValueOnce('projects/bautista/messages/msg_123');

      await fcmService.sendPush('valid-token-123', 'Pedido Listo', 'Tu pedido está listo para recoger', {
        orderId: 'ord-999',
      });

      expect(sendMock).toHaveBeenCalledWith({
        token: 'valid-token-123',
        notification: {
          title: 'Pedido Listo',
          body: 'Tu pedido está listo para recoger',
        },
        data: {
          orderId: 'ord-999',
        },
      });
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notificación push FCM enviada con éxito'),
        expect.objectContaining({ title: 'Pedido Listo' })
      );
    });

    it('Token no registrado → maneja error con warning sin crash', async () => {
      const error = { code: 'messaging/registration-token-not-registered', message: 'Token not registered' };
      sendMock.mockRejectedValueOnce(error);

      await expect(
        fcmService.sendPush('unregistered-token', 'Título', 'Cuerpo')
      ).resolves.not.toThrow();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token FCM inválido o no registrado'),
        expect.objectContaining({ token: 'unregistered-token', code: error.code })
      );
    });

    it('Error general de Firebase → se captura en logger.error sin crash', async () => {
      const error = new Error('Network timeout');
      sendMock.mockRejectedValueOnce(error);

      await expect(
        fcmService.sendPush('valid-token', 'Título', 'Cuerpo')
      ).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al enviar notificación push con FCM'),
        expect.objectContaining({ error })
      );
    });
  });

  describe('sendMulticast', () => {
    it('Firebase no inicializado → retorna resultado por defecto', async () => {
      (admin.apps as any) = [];

      const result = await fcmService.sendMulticast(['token1', 'token2'], 'Aviso', 'Texto');

      expect(result).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin no está inicializado')
      );
    });

    it('Lista de tokens vacía → emite warning y retorna resultado vacío', async () => {
      const result = await fcmService.sendMulticast([], 'Aviso', 'Texto');

      expect(result).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Lista de tokens vacía')
      );
    });

    it('sendMulticast exitoso filtra tokens inválidos y retorna estadísticas', async () => {
      sendEachForMulticastMock.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 2,
        responses: [
          { success: true, messageId: 'msg-1' },
          {
            success: false,
            error: { code: 'messaging/registration-token-not-registered' },
          },
          {
            success: false,
            error: { code: 'messaging/invalid-registration-token' },
          },
        ],
      });

      const tokens = ['token-valido', 'token-expirado', 'token-malformado'];
      const result = await fcmService.sendMulticast(tokens, 'Carnitas recién salidas', 'Ven por tu pedido', {
        type: 'PROMO',
      });

      expect(sendEachForMulticastMock).toHaveBeenCalledWith({
        tokens,
        notification: {
          title: 'Carnitas recién salidas',
          body: 'Ven por tu pedido',
        },
        data: {
          type: 'PROMO',
        },
      });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(2);
      expect(result.invalidTokens).toEqual(['token-expirado', 'token-malformado']);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tokens FCM inválidos o no registrados detectados'),
        expect.objectContaining({ count: 2 })
      );
    });

    it('Error en sendEachForMulticast → captura error y retorna default result', async () => {
      sendEachForMulticastMock.mockRejectedValueOnce(new Error('FCM Internal Error'));

      const result = await fcmService.sendMulticast(['token1'], 'Título', 'Cuerpo');

      expect(result).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al enviar notificación multicast con FCM'),
        expect.any(Object)
      );
    });
  });

  describe('sendToTopic', () => {
    it('Firebase no inicializado → no ejecuta llamada', async () => {
      (admin.apps as any) = [];

      await fcmService.sendToTopic('kitchen', 'Nueva Comanda', 'Orden #BG-1');

      expect(sendMock).not.toHaveBeenCalled();
    });

    it('Topic vacío → emite warning', async () => {
      await fcmService.sendToTopic('', 'Título', 'Cuerpo');

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Topic no provisto o inválido')
      );
    });

    it('sendToTopic exitoso → envía al topic correspondiente', async () => {
      sendMock.mockResolvedValueOnce('projects/bautista/topics/kitchen/1');

      await fcmService.sendToTopic('kitchen', 'Nueva Comanda', 'Orden #BG-100', { orderId: '100' });

      expect(sendMock).toHaveBeenCalledWith({
        topic: 'kitchen',
        notification: {
          title: 'Nueva Comanda',
          body: 'Orden #BG-100',
        },
        data: {
          orderId: '100',
        },
      });
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notificación push FCM enviada al topic'),
        expect.objectContaining({ topic: 'kitchen', title: 'Nueva Comanda' })
      );
    });
  });

  describe('subscribeToTopic & unsubscribeFromTopic', () => {
    it('subscribeToTopic suscribe tokens exitosamente', async () => {
      subscribeToTopicMock.mockResolvedValueOnce({
        successCount: 2,
        failureCount: 0,
        errors: [],
      });

      await fcmService.subscribeToTopic(['tok1', 'tok2'], 'kitchen');

      expect(subscribeToTopicMock).toHaveBeenCalledWith(['tok1', 'tok2'], 'kitchen');
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tokens suscritos exitosamente al topic "kitchen"'),
        expect.objectContaining({ successCount: 2 })
      );
    });

    it('subscribeToTopic con fallos emite warning', async () => {
      subscribeToTopicMock.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 1,
        errors: [{ index: 1, error: { code: 'INVALID' } }],
      });

      await fcmService.subscribeToTopic(['tok1', 'tok2'], 'kitchen');

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hubo 1 fallos al suscribir tokens al topic "kitchen"'),
        expect.any(Object)
      );
    });

    it('unsubscribeFromTopic desuscribe tokens exitosamente', async () => {
      unsubscribeFromTopicMock.mockResolvedValueOnce({
        successCount: 1,
        failureCount: 0,
        errors: [],
      });

      await fcmService.unsubscribeFromTopic('tok1', 'kitchen');

      expect(unsubscribeFromTopicMock).toHaveBeenCalledWith('tok1', 'kitchen');
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tokens desuscritos exitosamente del topic "kitchen"'),
        expect.objectContaining({ successCount: 1 })
      );
    });
  });
});
