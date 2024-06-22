import { Response, NextFunction, Request } from 'express';
// import { ExtendedRequest } from './authMiddleware';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error: ${err.message}`);
  res.status(500).send('Internal Server Error');
};

export default errorMiddleware;