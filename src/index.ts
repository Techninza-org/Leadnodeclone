import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import { middleware } from './middleware';
import logger from './utils/logger';
import config from './config';
import resolvers from './resolvers'
import schema from './schema';

const app = express();
const PORT = config.envProvider.PORT;

app.use(cors({ origin: '*' }));
app.use(middleware.loggerMiddleware);

app.all('/auth', createHandler({ schema: schema.authSchema, rootValue: resolvers.authResolvers }));
app.all('/admin', createHandler({ schema: schema.adminSchema, rootValue: resolvers.adminResolvers }));
app.all('/lead', createHandler({ schema: schema.leadSchema, rootValue: resolvers.leadResolvers }));
app.all('/user', createHandler({ schema: schema.userSchema, rootValue: resolvers.userResolvers }));

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
