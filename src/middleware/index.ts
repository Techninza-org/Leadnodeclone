import loggerMiddleware from './loggerMiddleware';
import errorMiddleware from './errorMiddleware';
import {
    userAuthMiddleware,
} from './authMiddleware';

export const middleware = {
    loggerMiddleware,
    userAuthMiddleware,
    errorMiddleware
};
