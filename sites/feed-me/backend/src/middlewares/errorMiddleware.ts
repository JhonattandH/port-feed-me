/**
 * Middleware de Erro
 * Responsável por tratar erros de forma centralizada
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

// Interface para erro com código HTTP
export interface HttpError extends Error {
  status?: number;
  code?: number;
  errors?: any;
}

/**
 * Middleware para tratamento de erros
 * Centraliza o tratamento de exceções da aplicação
 */
export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // Log completo apenas em desenvolvimento
  if (config.isDev) {
    console.error('❌ Erro na aplicação:', err);
  } else {
    // Em produção, log mais limitado
    console.error(`❌ ${err.name}: ${err.message}`);
  }
  
  // Status HTTP
  const status = err.status || 500;
  
  // Resposta formatada
  const errorResponse = {
    error: {
      message: err.message || 'Erro interno do servidor',
      // Inclui mais detalhes apenas em desenvolvimento
      ...(config.isDev && { 
        stack: err.stack,
        errors: err.errors,
        code: err.code
      })
    }
  };
  
  // Retorna a resposta formatada
  res.status(status).json(errorResponse);
};

/**
 * Middleware para capturar rotas não encontradas (404)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`) as HttpError;
  error.status = 404;
  next(error);
};

/**
 * Função para criar erros HTTP
 */
export const createHttpError = (message: string, status: number, details?: any): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  
  if (details) {
    error.errors = details;
  }
  
  return error;
};
