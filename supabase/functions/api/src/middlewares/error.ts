// @deno-types="npm:@types/express@^4.17"
import { Request, Response, NextFunction } from 'npm:express@4.18.2';

export function errorMiddleware(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  console.error(JSON.stringify({ error: message, stack: err.stack }));

  res.status(status).json({ error: { message } });
}
