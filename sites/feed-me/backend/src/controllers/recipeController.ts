import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const recipeController = {
  async generateRecipe(req: Request, res: Response) {
    try {
      const { mealType } = req.body;
      
      if (!mealType) {
        return res.status(400).json({ message: 'O tipo de refeição é obrigatório' });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Gere uma receita para um(a) ${mealType}. A receita deve incluir:
      1. Nome da receita
      2. Lista de ingredientes com quantidades
      3. Modo de preparo detalhado
      4. Tempo de preparo estimado
      5. Rendimento (porções)
      
      Por favor, formate a resposta de maneira clara e organizada.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const recipe = response.text();

      res.json({ recipe });
    } catch (error) {
      console.error('Erro ao gerar receita:', error);
      res.status(500).json({ message: 'Erro ao gerar receita', error });
    }
  }
};
