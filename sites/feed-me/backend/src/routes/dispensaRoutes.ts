/**
 * Rotas da Dispensa
 * Define os endpoints para gerenciar itens da dispensa
 */

import express, { Router } from 'express';
import { dispensaController } from '../controllers/dispensaController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   GET /api/dispensa
 * @desc    Lista todos os itens da dispensa
 * @access  Privado
 */
router.get('/dispensa', dispensaController.list);

/**
 * @route   POST /api/dispensa
 * @desc    Adiciona um novo item à dispensa
 * @access  Privado
 */
router.post('/dispensa', dispensaController.create);

/**
 * @route   PUT /api/dispensa/:id
 * @desc    Atualiza um item da dispensa
 * @access  Privado
 */
router.put('/dispensa/:id', dispensaController.update);

/**
 * @route   DELETE /api/dispensa/:id
 * @desc    Remove um item da dispensa
 * @access  Privado
 */
router.delete('/dispensa/:id', dispensaController.delete);

export default router;
