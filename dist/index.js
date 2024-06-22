"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import { schema } from './schema';
// import { root } from './resolvers';
const app = (0, express_1.default)();
// app.use('/graphql', createHandler({
//   schema,
//   rootValue: root,
//   graphiql: true,
// }));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
