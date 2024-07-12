export const userSchema = `
  type Role {
    id: ID!
    name: String!
    members: [Member!]
    createdAt: String!
    updatedAt: String!
  }

  type CreateRoleResponse {
    role: Role
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    deptId: String
    role: Role!
    sessionToken: String
    token: String!
    companyId: String!
  }

  type Member {
    id: ID!
    name: String!
    email: String!
    phone: String!
    dept: Dept!
    role: Role
    company: Company!
    createdAt: String!
    updatedAt: String!
  }

  type Company {
    id: ID!
    userId: String!
    name: String!
    email: String!
    phone: String!
    members: [Member!]
    leads: [Lead!]
    depts: [Dept!]
    createdAt: String!
    updatedAt: String!
  }

   type leadStatus {
    id: ID!
    name: String
    description: String!
    callStatus: String!
    paymentStatus: String!
    leads: [Lead!]
    Depts: [Dept!]
    assignedTo: Member!
    createdAt: String!
    updatedAt: String!
  }

  type LeadResponse {
    lead: Lead
    message: String
  }

  enum UpdateManagerType {
    COMPANY
    DEPARTMENT
    BOTH
  }
`