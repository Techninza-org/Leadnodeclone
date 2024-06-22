// import { ExtendedRequest } from './authMiddleware';
import { Response, NextFunction, Request } from 'express';
import logger from '../utils/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    logger.info(`${req.method} ${req.url} ${res.statusCode} - ${elapsedTimeInMs.toFixed(2)} ms`);
  });

  next();
};

export default loggerMiddleware;