import { buildSchema } from "graphql";
import { authSchema } from "./authSchema";
import { adminSchema } from "./adminSchema";
import { leadSchema } from "./leadSchema";
import { userSchema } from "./userSchema";

const queries_mutation = `
scalar JSON

type jsonType { 
  data: JSON
}

type Query {
    getAllUsers: [User]
    getUser(id: ID!): User
    getAllRoles: [Role]
    getAllLeads: [Lead]
    getCompanyLeads(companyId: String!): LeadAndGroupedLeads
    getLeadsByDateRange(companyId: ID!, startDate: String!, endDate: String!): RootDashboardResponse
    getCompanyLeadById(companyId: String!, leadId: String!): Lead
    getCompanyDeptMembers(companyId: String!, deptId: String): [Member]
    getAssignedLeads(userId: String!): [Lead]
    getDeptWFields: [Dept]
    getDeptsAdmin: [Dept]
    getRootUsers: [Member]
    getDepts(companyId: String!): [Dept]
    getCompanyDepts(companyId: String!): [Dept]
    getCompanyDeptFields(deptId: String): [CompanyDeptForm]
    getCompanyDeptOptFields: [CompanyDeptForm]
    getLeadBids(leadId: String!): [Bid]
    getMemberLocation(memberId: String!, date: String!): MemberLocation
    getTransferedLeads(userId: String!): [Lead]
    getMembersByRole(role: String!): [Member]
    getFollowUpByLeadId(leadId: String!): [FollowUp]
    getPlatform: String
    getPlans: [Plan]
    getBroadcasts: [Broadcast]
    getBroadcastById(broadcastId: ID!): Broadcast
    getCompanySubscription(companyId: String!): Company
    broadcastForm: [BroadcastForm]
    getFollowUps: [FollowUp]
    getCompanyXchangerBids: [Bid]
    xChangerCustomerList: jsonType
    getLeadPhotos: jsonType
    getExchangeLeadImgs: jsonType
    paymentList: jsonType    
    getCompanyProspects: [Lead]
  }

  type Mutation {
    createNUpdateCompanyDeptForm(input: CreateDeptFormInput!): Dept
    createNUpdateCompanyDeptOptForm(input: CreateDeptFormInput!): Dept

    updateUser(updateUserInput: UpdateUserInput!): User
    generateOTP(phone: String!): GenerateOTPResponse
    savedMemberLocation(memberId: String!, locations: [LocationInput]): MemberLocation
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

    leadTransferTo(leadId: ID!, transferToId: ID!): Lead
    
    loginUser(email: String, password: String, phone: String, otp: String, platform: String): LoginUserResponse

    appvedLead(leadId: ID!, status: Boolean): Lead

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

    createNUpdateSubscriptionPlan(input: PlanInput!): Plan

    updateCompanySubscription(companyId: String!, planId: String!, allowedDeptsIds: [String!], startDate: String!, endDate: String!): Company

    createLead(input: LeadInput!): LeadResponse
    
    leadAssignTo(companyId: String!, leadIds: [String!]!, deptId: String, userIds: [String!]!, description: String): [Lead]

    submitFeedback(nextFollowUpDate: String, deptId: String!, leadId: String!, callStatus: String!, paymentStatus: String!, feedback: [FeedbackInput!]!, urls: [String], submitType: String, formName: String): LeadResponse

    submitBid(companyId: String!, deptId: String!, leadId: String!, bidAmount: String!, description: String): Bid

    updateLeadFinanceStatus(leadId: String!, financeStatus: Boolean!): Lead

    updateLeadFollowUpDate(leadId: String!, nextFollowUpDate: String!, remark: String!, customerResponse: String!, rating: String!): Lead

    updateLeadPaymentStatus(leadId: String!, paymentStatus: String!): Lead

    createnUpdateCompanyDept(companyId: String!, deptId: String, input: CreateDeptInput!): CreateDeptResponse

    deleteBroadcast(broadcastId: ID!): Broadcast

    createBroadcastForm(input: CreateBroadcastInput!): BroadcastForm
    updateBroadcastForm(input: [CreateBroadcastInput]!): [BroadcastForm]
  }
`
const allSchemas = [authSchema, adminSchema, leadSchema, userSchema, queries_mutation];

export const schema = buildSchema(
  allSchemas.join("\n")
);