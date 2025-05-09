import { Request, Response } from 'express';

export interface TypedRequest<T = any> extends Request {
  body: T;
}

export interface TypedResponse<ResBody = any> extends Response {
  json: (body: ResBody) => this;
}
