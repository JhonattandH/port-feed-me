/**
 * Rotas de Autenticação
 * Define os endpoints relacionados à autenticação de usuários
 * Inclui rotas para registro, login e verificação de token
 */

import express, { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registra um novo usuário
 * @access  Público
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Autentica um usuário e retorna um token
 * @access  Público
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verifica se o token é válido
 * @access  Privado
 */
router.get('/verify', authController.verifyToken);

export const authRoutes = router;
