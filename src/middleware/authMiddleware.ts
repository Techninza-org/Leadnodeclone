import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import prisma from '../config/database';
import { Member } from '@prisma/client';

export interface ExtendedRequest extends Request {
  user?: Member | null;
}

type decodedTokenType = {
  id: string;
  iat: number;
  exp: number;
};

export const userAuthMiddleware = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    if (req?.body?.query?.includes("loginUser") || req?.body?.query?.includes("createUser") || req?.body?.query?.includes("generateOTP")) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }

    if (!authHeader.startsWith('x-lead-token ')) {
      return res.status(401).send('Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = JWT.verify(token, process.env.JWT_SECRET!) as decodedTokenType;

    const user = await prisma.member.findUnique({
      where: {
        id: decodedToken.id,
      },
      include: {
        role: true
      }
    });

    req.user = user
    next();
  } catch (error: any) {
    if(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.message.includes('jwt expired')){
      return res.status(401).send('Token Expired or Invalid Token');
    }
    return res.status(401).send('Unauthorized');
  }
};