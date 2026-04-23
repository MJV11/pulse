import { app } from './src/app.ts';

app.listen(3000, (err: unknown) => {
  if (err) {
    console.error('Failed to start server:', err);
  }
});
