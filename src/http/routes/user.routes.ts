import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

export const userRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Administración de personal y usuarios (Exclusivo Administradores)
 */

// Gestión de personal exclusivo para ADMIN
userRoutes.use(authenticateJwt, requireRole('ADMIN'));

/**
 * @swagger
 * /api/users/employees:
 *   post:
 *     summary: Registrar un empleado (Cocina, Repartidor o Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Carlos Cocinero
 *               email:
 *                 type: string
 *                 example: carlos@bautistago.mx
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password123!
 *               role:
 *                 type: string
 *                 enum: [KITCHEN_OPERATOR, DELIVERY_DRIVER, ADMIN]
 *                 example: KITCHEN_OPERATOR
 *               phone:
 *                 type: string
 *                 example: "4159876543"
 *               vehiclePlate:
 *                 type: string
 *                 example: "GTO-123-A"
 *     responses:
 *       201:
 *         description: Empleado registrado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       403:
 *         description: Permisos insuficientes
 *       409:
 *         description: El correo ya existe
 *   get:
 *     summary: Listar empleados activos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [KITCHEN_OPERATOR, DELIVERY_DRIVER, ADMIN]
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       403:
 *         description: Permisos insuficientes
 */
userRoutes.post('/employees', asyncHandler(UserController.registerEmployee));
userRoutes.get('/employees', asyncHandler(UserController.listEmployees));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Desactivar usuario / empleado (baja lógica)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *       404:
 *         description: Usuario no encontrado
 */
userRoutes.delete('/:id', asyncHandler(UserController.deactivate));

/**
 * @swagger
 * /api/users/{id}/reactivate:
 *   patch:
 *     summary: Reactivar usuario / empleado desactivado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario reactivado
 *       404:
 *         description: Usuario no encontrado
 */
userRoutes.patch('/:id/reactivate', asyncHandler(UserController.reactivate));
