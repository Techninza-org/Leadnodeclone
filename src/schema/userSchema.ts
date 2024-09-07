export const userSchema = `
  input LocationInput {
    latitude: Float!
    longitude: Float!
    idleTime: String
    movingTime: String!
  }

  type MemberLocation {
    id: ID!
    leadAssingeeMemberId: String!
    locations: [Location]!
    day: String!
  }

  type Location {
    latitude: Float!
    longitude: Float!
    idleTime: String
    timestamp: String!
    movingTime: String!
  }

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
    companyId: String!
    Company: Company!
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
    Subscriptions: [Subscription!]
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