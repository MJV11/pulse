// @deno-types="npm:@types/express@^4.17"
import { Request, Response, NextFunction } from 'npm:express@4.18.2';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin ?? '*';

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, x-client-info, Cache-Control',
  );
  res.header('Access-Control-Expose-Headers', 'Authorization, Content-Length');

  next();
}
