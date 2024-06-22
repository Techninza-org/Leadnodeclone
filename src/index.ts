import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import { middleware } from './middleware';
// import { schema } from './schema';
// import { root } from './resolvers';

const app = express();
const corsOptions = {
    origin: ['http://localhost:3000', 'https://your-mobile-app-domain.com'], // replace with your mobile app domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // if your frontend sends cookies or needs to access protected routes
};

app.use(cors(corsOptions));
app.use(middleware.loggerMiddleware);
// app.use('/graphql', createHandler({
//   schema,
//   rootValue: root,
//   graphiql: true,
// }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
