import { buildSchema } from "graphql";
import { authSchema } from "./authSchema";
import { adminSchema } from "./adminSchema";
import { leadSchema } from "./leadSchema";
import { userSchema } from "./userSchema";

const queries_mutation = `
type Query {
    getAllUsers: [User]
    getUser(id: ID!): User
    getAllRoles: [Role]
    getAllLeads: [Lead]
    getCompanyLeads(companyId: String!): [Lead]
    getCompanyLeadById(companyId: String!, leadId: String!): Lead
    getCompanyDeptMembers(companyId: String!, deptId: String): [Member]
    getAssignedLeads(userId: String!): [Lead]
    getDeptFields(deptId: String!): Dept
    getDepts(companyId: String!): [Dept]
    getCompanyDepts(companyId: String!): [Dept]
    getCompanyDeptFields(deptId: String!): [CompanyDeptForm]
    getLeadBids(leadId: String!): [Bid]
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

    createOrUpdateManager(
      memberId: ID,
      name: String,
      email: String,
      password: String,
      phone: String,
      memberType: String!,
      companyId: ID!,
      deptId: ID
    ): CreateUserResponse

    createUserRole(name: String!): CreateRoleResponse

    createDept(input: CreateDeptInput!): CreateDeptResponse

    createLead(input: LeadInput!): LeadResponse
    
    leadAssignTo(companyId: String!, leadIds: [String!]!, deptId: String!, userIds: [String!]!, description: String): [Lead]

    submitFeedback(deptId: String!, leadId: String!, callStatus: String!, paymentStatus: String!, feedback: [FeedbackInput!]!, urls: [String], submitType: String): LeadResponse

    submitBid(companyId: String!, deptId: String!, leadId: String!, bidAmount: String!, description: String): Bid

    updateLeadFinanceStatus(leadId: String!, financeStatus: Boolean!): Lead
  }
`
const allSchemas = [authSchema, adminSchema, leadSchema, userSchema, queries_mutation];

export const schema = buildSchema(
  allSchemas.join("\n")
);