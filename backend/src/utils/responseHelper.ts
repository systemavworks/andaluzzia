import { Response } from 'express';

interface ApiSuccess<T> {
  ok:   true;
  data: T;
}

interface ApiError {
  ok:    false;
  error: string;
  code?: string;
}

export const sendOk = <T>(res: Response, data: T, status = 200): void => {
  const body: ApiSuccess<T> = { ok: true, data };
  res.status(status).json(body);
};

export const sendError = (res: Response, message: string, status = 500, code?: string): void => {
  const body: ApiError = { ok: false, error: message, ...(code ? { code } : {}) };
  res.status(status).json(body);
};
