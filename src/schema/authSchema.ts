import { buildSchema } from 'graphql';

export const authSchema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
  }

  type Error {
    message: String!
    path: [String!]
  }

  type CreateUserResponse {
    user: User
    errors: [Error!]
  }

  type Query {
    getAllUsers: [User]
  }

  type Mutation {
    createUser(name: String!, email: String!, phone: String!, password: String!): CreateUserResponse
  }
`);
