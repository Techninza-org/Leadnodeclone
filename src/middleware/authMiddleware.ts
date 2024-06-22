import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { prisma } from '../config';
// import { User, Vendor } from '@prisma/client';

import { USER_WITHOUT_PASSWORD } from '../utils/db-utils';

// export interface ExtendedRequest extends Request {
//   user?: User;
//   vendor?: Vendor;
// }

type decodedTokenType = {
  id: string;
  iat: number;
  exp: number;
};

export const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Add your admin authentication logic here
  next();
};