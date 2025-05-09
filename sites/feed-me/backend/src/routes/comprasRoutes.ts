import { Router, Request, Response } from 'express';
import { comprasController } from '../controllers/comprasController';

const router = Router();

type AsyncRequestHandler = (req: Request, res: Response) => Promise<any>;

const asyncHandler = (handler: AsyncRequestHandler) => {
  return async (req: Request, res: Response) => {    try {
      await handler(req, res);
    } catch (error: any) {
      const errorMessage = error?.message || 'Um erro interno ocorreu';
      res.status(500).json({ error: errorMessage });
    }
  };
};

router.get('/compras', asyncHandler(async (req, res) => await comprasController.list(req, res)));
router.post('/compras', asyncHandler(async (req, res) => await comprasController.create(req, res)));
router.put('/compras/:id', asyncHandler(async (req, res) => await comprasController.update(req, res)));
router.delete('/compras/:id', asyncHandler(async (req, res) => await comprasController.delete(req, res)));
router.post('/compras/finish', asyncHandler(async (req, res) => await comprasController.finishShopping(req, res)));
router.get('/compras/history', asyncHandler(async (req, res) => await comprasController.listHistory(req, res)));

export default router;
