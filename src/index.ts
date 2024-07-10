import path from 'path';
import fs from 'fs';

import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import config from './config';
import upload from './config/multer-config';
import { middleware } from './middleware';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './schema';
import { resolvers } from './resolvers';
import { uploadImage } from './controller/image.controller';

const app = express();
const PORT = config.envProvider.PORT;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(middleware.loggerMiddleware);

app.use('/images', express.static(path.join(__dirname, 'uploads')));

// app.get('/images/:filename', (req, res) => {
//     const filename = req.params.filename;
//     const filePath = path.join(__dirname, 'uploads', filename);
//     console.log(filePath)

//     fs.access(filePath, fs.constants.F_OK, (err) => {
//         if (err) {
//             return res.status(404).send({ message: 'File not found' });
//         }
//         res.sendFile(filePath);
//     });
// });

app.post('/graphql/upload', upload.array('files'), uploadImage);

app.use('/graphql', middleware.userAuthMiddleware, createHandler({
    schema: schema,
    rootValue: resolvers,
    context: (req: any) => ({ user: req.raw.user }),
}));

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
