import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import config from './config';
import { middleware } from './middleware';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { resolvers } from './resolvers';

const app = express();
const PORT = config.envProvider.PORT;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(middleware.loggerMiddleware);

app.all('/api/', middleware.userAuthMiddleware, createHandler({
    schema: schema,
    rootValue: resolvers,
    context: (req: any) => ({ user: req.raw.user }),
}));

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
