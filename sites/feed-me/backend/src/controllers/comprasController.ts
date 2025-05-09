import { Request, Response } from 'express';
import { ComprasItem, CompletedPurchase } from '../models/ComprasItem';

export const comprasController = {
  // Listar todos os itens da lista de compras
  async list(req: Request, res: Response) {
    try {
      const items = await ComprasItem.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar lista de compras', error });
    }
  },

  // Adicionar novo item à lista
  async create(req: Request, res: Response) {
    try {
      const newItem = new ComprasItem(req.body);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ message: 'Erro ao adicionar item à lista', error });
    }
  },

  // Atualizar item
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedItem = await ComprasItem.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item não encontrado' });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: 'Erro ao atualizar item', error });
    }
  },

  // Deletar item
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedItem = await ComprasItem.findByIdAndDelete(id);
      if (!deletedItem) {
        return res.status(404).json({ message: 'Item não encontrado' });
      }
      res.json({ message: 'Item deletado com sucesso' });
    } catch (error) {
      res.status(400).json({ message: 'Erro ao deletar item', error });
    }
  },

  // Finalizar compras e salvar histórico
  async finishShopping(req: Request, res: Response) {
    try {
      const { items, totalSpent } = req.body;
      
      // Criar novo registro de compra concluída
      const completedPurchase = new CompletedPurchase({
        items,
        totalSpent,
        date: new Date()
      });
      await completedPurchase.save();

      // Atualizar ou remover itens da lista de compras
      for (const item of items) {
        if (item.bought >= item.quantity) {
          await ComprasItem.findByIdAndDelete(item._id);
        } else {
          await ComprasItem.findByIdAndUpdate(item._id, {
            quantity: item.quantity - item.bought,
            bought: 0
          });
        }
      }

      res.status(201).json(completedPurchase);
    } catch (error) {
      res.status(400).json({ message: 'Erro ao finalizar compras', error });
    }
  },

  // Listar histórico de compras
  async listHistory(req: Request, res: Response) {
    try {
      const history = await CompletedPurchase.find()
        .sort({ date: -1 })
        .limit(10); // Limita aos 10 registros mais recentes
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar histórico de compras', error });
    }
  }
};
