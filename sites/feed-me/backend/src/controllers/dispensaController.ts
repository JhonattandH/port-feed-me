/**
 * Controlador de Itens da Dispensa
 * Gerencia todas as operações relacionadas aos itens armazenados na dispensa
 */

import { Request, Response, NextFunction } from 'express';
import DispensaItem, { IDispensaItem } from '../models/DispensaItem';
import mongoose from 'mongoose';

// Interface para os dados de criação/atualização de item
interface DispensaItemDTO {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: Date;
  userId?: string;
}

// Interface para requisição autenticada
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export const dispensaController = {
  /**   * Lista todos os itens da dispensa do usuário
   */
  async list(req: Request, res: Response) {
    try {
      // CORS aberto - sem filtro por usuário para desenvolvimento
      console.log("Listando todos os itens da dispensa - Modo de desenvolvimento com CORS aberto");
      const items = await DispensaItem.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      res.status(500).json({ message: 'Erro ao buscar itens da dispensa' });
    }
  },

  /**
   * Adiciona novo item à dispensa
   */
  async create(req: Request, res: Response) {
    try {
      // Em uma implementação real, deve adicionar o userId
      // const userId = (req as AuthenticatedRequest).user?.userId;
      const { name, quantity, unit, category, expirationDate } = req.body as DispensaItemDTO;
      
      // Validação básica
      if (!name || !quantity || !unit || !category) {
        return res.status(400).json({ 
          message: 'Dados incompletos',
          required: ['name', 'quantity', 'unit', 'category'] 
        });
      }

      const newItem = new DispensaItem(req.body);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      res.status(400).json({ message: 'Erro ao criar item na dispensa' });
    }
  },

  /**
   * Atualiza item da dispensa
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validação de ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      // Em uma implementação real, deve verificar se o item pertence ao usuário
      // const userId = (req as AuthenticatedRequest).user?.userId;
      
      const updatedItem = await DispensaItem.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item não encontrado' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(400).json({ message: 'Erro ao atualizar item' });
    }
  },

  /**
   * Remove item da dispensa
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validação de ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      // Em uma implementação real, deve verificar se o item pertence ao usuário
      // const userId = (req as AuthenticatedRequest).user?.userId;
      
      const deletedItem = await DispensaItem.findByIdAndDelete(id);
      
      if (!deletedItem) {
        return res.status(404).json({ message: 'Item não encontrado' });
      }
      
      res.json({ message: 'Item removido com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      res.status(400).json({ message: 'Erro ao deletar item' });
    }
  }
};
