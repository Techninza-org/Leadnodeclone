import path from 'path';
import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import config from './config';
import upload, { readOnlyupload } from './config/multer-config';
import { middleware } from './middleware';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { resolvers } from './resolvers';
import { broadcastMessage, handleCreateBulkLead, handleCreateBulkProspect, uploadImage } from './controller/image.controller';
import prisma from './config/database';

const app = express();
const PORT = config.envProvider.PORT;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(middleware.loggerMiddleware);

app.use('/graphql/images', express.static(path.join(__dirname, 'uploads')));

app.post('/graphql/upload', upload.any(), uploadImage);
app.post('/graphql/broadcastMessage', middleware.userAuthMiddleware, upload.any(), broadcastMessage);
app.post('/graphql/bulk-upload-lead', middleware.userAuthMiddleware, handleCreateBulkLead);
app.post('/graphql/bulk-upload-prospect', middleware.userAuthMiddleware, handleCreateBulkProspect);

app.use('/graphql', middleware.userAuthMiddleware, createHandler({
    schema: schema,
    rootValue: resolvers,
    context: (req: any) => ({ user: req.raw.user }),
}));

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

// prisma.role.create({
//     data: {
//         name: 'Telecaller',
//         companyId: "67644a7abd3b295e0dbdb221"
//     }
// }).then(() => {
//     logger.info('Admin role created');
// }).catch((err) => {
//     logger.error('Error creating admin role', err);
// })
