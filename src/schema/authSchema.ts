import { buildSchema } from 'graphql';

export const authSchema = buildSchema(`
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

  type LoginUserResponse {
    user: User
    errors: [Error!]
  }

  type Query {
    getAllUsers: [User]
  }

  type Mutation {
    createUser(
      name: String!,
      email: String!,
      phone: String!,
      password: String!,
      roleId: String,
      deptId: String,
      companyId: String,
      companyName: String,
      companyAddress: String,
      companyPhone: String,
      companyEmail: String
    ): CreateUserResponse
    
    loginUser(email: String, password: String, phone: String, otp: String): LoginUserResponse
  }
`);
