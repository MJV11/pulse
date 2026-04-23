// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Example route is working' });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, message: `Fetched example with id: ${id}` });
});

export { router as exampleRouter };
