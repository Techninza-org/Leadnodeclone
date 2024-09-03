import { Response, NextFunction, Request } from 'express';
import logger from '../utils/logger';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).send('Internal Server Error');
};

export default errorMiddleware;