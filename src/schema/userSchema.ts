import { buildSchema } from 'graphql';

export const userSchema = buildSchema(`
  type Role {
    id: ID!
    name: String!
  }
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: Role
    sessionToken: String
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
    getUser(id: ID!): User
  }

  enum UpdateManagerType {
    COMPANY
    DEPARTMENT
    BOTH
  }

  type Mutation {
    createOrUpdateManager(
        memberId: ID, 
        name: String,
        email: String,
        password: String,
        phone: String,
        type: UpdateManagerType!, 
        companyId: ID!, 
        deptId: ID
    ): CreateUserResponse
  }
`);
