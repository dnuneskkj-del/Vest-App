import appPromise from '../server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req as any, res as any);
}
