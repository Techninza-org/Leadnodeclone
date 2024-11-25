export const userSchema = `
  input CreateDeptFormInput { 
    companyDeptId: ID
    companyId: ID
    name: String!
    order: Int
    subDeptFields: [CreateDeptFieldInput!]!
  }

  input CreateDeptFieldInput {
    name: String!
    fieldType: String!
    value: String
    imgLimit: Int
    ddOptionId: String
    options: JSON
    order: Int!
    isDisabled: Boolean
    isRequired: Boolean
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
    apiHitTime: String
    idleTime: String
    batteryPercentage: String
    networkStrength: String
    movingTime: String!
    isLocationOff: Boolean
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
    apiHitTime: String
    movingTime: String!
    batteryPercentage: String
    networkStrength: String
    isLocationOff: Boolean
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
    platform: String
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
    Leads: [Lead!]
    depts: [Dept!]
    Depts: [Dept!]
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

  input UpdateUserInput {
    name: String
    email: String
    phone: String
    deptId: String
    roleId: String
  }

  type Broadcast { 
    id: ID!
    subCategory: String!
    desc: String
    option: String!
    valueId: String!
    imgURL: [ImageURL]
    companyId: String!
    createdAt: String!
    updatedAt: String!
  }

  type ImageURL {
    fieldname: String!
    url: String!
  }
`