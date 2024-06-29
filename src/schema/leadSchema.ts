import { buildSchema } from 'graphql';

export const leadSchema = buildSchema(`
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
    LeadStatuses: [LeadStatus!]
    deptFields: [DeptField]
    createdAt: String!
    updatedAt: String!
  }

  type Role {
    id: ID!
    name: String!
    members: [Member!]
    createdAt: String!
    updatedAt: String!
  }

  type Member {
    id: ID!
    name: String!
    email: String!
    phone: String!
    dept: Dept!
    role: Role
    Company: Company!
    LeadStatuses: [LeadStatus!]
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
    Depts: [Dept!]
    createdAt: String!
    updatedAt: String!
  }

  type LeadStatus {
    id: ID!
    description: String!
    callStatus: String!
    paymentStatus: String!
    leads: [Lead!]
    Depts: [Dept!]
    assignedTo: Member!
    createdAt: String!
    updatedAt: String!
  }

  type Lead {
    id: ID!
    name: String!
    email: String!
    phone: String!
    alternatePhone: String
    address: String!
    city: String!
    state: String!
    zip: String!
    rating: Int!
    vehicleDate: String!
    vehicleName: String!
    vehicleModel: String!
    LeadStatus: LeadStatus!
    Company: Company!
    createdAt: String!
    updatedAt: String!
  }

  type Error {
    message: String!
    path: [String!]
  }

  type leadResponse {
    lead: Lead
    message: String
    errors: [Error!]
  }

  input LeadInput {
    companyId: String!
    name: String!
    email: String!
    phone: String!
    alternatePhone: String
    address: String!
    city: String!
    state: String!
    zip: String!
    rating: Int
    vehicleDate: String
    vehicleName: String
    vehicleModel: String
  }

  
  enum FieldType {
    INPUT
    SELECT
    RADIO
    CHECKBOX
  }
  
  input FeedbackInput {
    name: String!
    fieldType: FieldType!
    value: String!
  }
    
  type Query {
    getAllLeads: [Lead]
    getCompanyLeads(companyId: String!): [Lead]
    getCompanyLeadById(companyId: String!, leadId: String!): Lead
  }

  type Mutation {
    createLead(input: LeadInput!): leadResponse
    leadAssignTo(companyId: String!, leadId: String!, deptId: String!, userId: String!, description: String): leadResponse
    submitFeedback(deptId: String!, leadId: String!, feedback: [FeedbackInput!]!): leadResponse
  }
`);
