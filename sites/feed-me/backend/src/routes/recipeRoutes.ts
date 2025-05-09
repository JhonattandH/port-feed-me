import { Router, Request, Response } from 'express';
import { recipeController } from '../controllers/recipeController';

const router = Router();

router.post('/recipe/generate', async (req: Request, res: Response) => {
  await recipeController.generateRecipe(req, res);
});

export default router;
