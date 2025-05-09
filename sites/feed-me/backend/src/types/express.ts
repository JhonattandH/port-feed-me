/**
 * Tipos para requisições e respostas do Express
 * Define interfaces tipadas para req.body, req.params e req.query
 */

import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

// Requisição com body tipado
export interface TypedRequestBody<T> extends Request {
  body: T;
}

// Requisição com params tipados
export interface TypedRequestParams<T extends ParamsDictionary> extends Request {
  params: T;
}

// Requisição com query tipada
export interface TypedRequestQuery<T extends Query> extends Request {
  query: T;
}

// Requisição completa tipada (body e params)
export interface TypedRequest<B = any, P extends ParamsDictionary = ParamsDictionary> extends Request {
  body: B;
  params: P;
}

// Requisição completa tipada (body, params e query)
export interface TypedRequestFull<
  B = any, 
  P extends ParamsDictionary = ParamsDictionary,
  Q extends Query = Query
> extends Request {
  body: B;
  params: P;
  query: Q;
}

// Resposta tipada
export interface TypedResponse<ResBody = any> extends Response {
  json: (body: ResBody) => this;
}

// Tipo para handlers de requisições
export type RequestHandler<
  ReqBody = any,
  ResBody = any,
  P extends ParamsDictionary = ParamsDictionary,
  ReqQuery extends Query = Query
> = (
  req: Request & { body: ReqBody; params: P; query: ReqQuery },
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Interface para controladores
export interface Controller {
  [key: string]: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
}

// Interface para o usuário autenticado na requisição
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

// Error com status HTTP
export class HttpError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
