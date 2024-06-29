import { buildSchema } from 'graphql';

export const adminSchema = buildSchema(`
  type Role {
    id: ID!
    name: String!
  }

   type Member {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: Role
    sessionToken: String
  }
    
  type DeptField {
    id: ID!
    name: String
    fieldType: String!
    value: String!
    dept: Dept!
    createdAt: String!
    updatedAt: String!
  }
    
  type Dept {
    id: ID!
    name: String!
    members: [Member!]
    deptFields: [DeptField]
    createdAt: String!
    updatedAt: String!
  }

  type Error {
    message: String!
    path: [String!]
  }

  type CreateRoleResponse {
    role: Role
    errors: [Error!]
  }

  type CreateDeptResponse {
    dept: Dept
    errors: [Error!]
  }

  enum FieldType {
    INPUT
    SELECT
    RADIO
    CHECKBOX
  }
  input DeptFields {
    name: String!
    fieldType: FieldType!
    value: String
  }

  input CreateDeptInput {
    name: String!
    deptFields: [DeptFields!]
  }

  type Query {
    getAllRoles: [Role]
  }

  type Mutation {
    createUserRole(name: String!): CreateRoleResponse
    createDept(input: CreateDeptInput!): CreateDeptResponse
  }
`);
