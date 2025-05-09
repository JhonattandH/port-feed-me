/**
 * Middleware de Autenticação
 * Responsável por verificar e validar tokens JWT
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/User';

// Interface para request autenticada
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

/**
 * Middleware que verifica se o usuário está autenticado
 * Verifica se o token JWT é válido e adiciona o usuário à requisição
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtém o token do header Authorization
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Autenticação necessária' });
    }

    try {
      // Verifica o token e obtém payload
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      
      // Adiciona o userId à requisição
      (req as AuthRequest).user = {
        userId: decoded.userId
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ message: 'Erro ao processar autenticação' });
  }
};

/**
 * Middleware para verificar se o usuário é dono do recurso
 * Verifica se o userId da requisição corresponde ao userId do recurso
 * Deve ser usado após o middleware authenticate
 */
export const isResourceOwner = (userIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (!authReq.user?.userId) {
        return res.status(401).json({ message: 'Autenticação necessária' });
      }

      if (authReq.user.userId !== resourceUserId) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar proprietário do recurso:', error);
      return res.status(500).json({ message: 'Erro ao verificar permissões' });
    }
  };
};
