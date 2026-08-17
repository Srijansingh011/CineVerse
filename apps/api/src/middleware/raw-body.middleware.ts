import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export function expressRaw(
  options: any = {
    type: 'application/json',
    limit: '5mb',
  }
): RequestHandler {
  return express.raw({
    ...options,
    verify: (
      req: Request,
      _res: Response,
      buf: Buffer
    ) => {
      (req as RawBodyRequest).rawBody = buf;
    },
  });
}
