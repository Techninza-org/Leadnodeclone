import { buildSchema } from 'graphql';

export const adminSchema = buildSchema(`
  type Role {
    id: ID!
    name: String!
  }

  type Error {
    message: String!
    path: [String!]
  }

  type CreateRoleResponse {
    role: Role
    errors: [Error!]
  }

  type Query {
    getAllRoles: [Role]
  }

  type Mutation {
    createUserRole(name: String!): CreateRoleResponse
  }
`);
