export const leadSchema = `

  type RootDashboardResponse { 
    callCount: Int
    totalPayCollectedCount: Int
    numberOfLeads: Int
    groupedCallPerday: JSON
    leadsWithFeedbackByRole: JSON
  }

  type groupedCallPerday { 
    date: String
    callCount: Int
  }

  type groupLeads { 
    formName: String
    feedback: [Feedback]
  }

  type LeadAndGroupedLeads { 
    lead: [Lead]
  }

  enum CallStatus {
    BUSY
    PENDING
    SUCCESS
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
  }

  type Bid { 
    id: ID!
    bidAmount: Float!
    description: String
    Member: Member!
    lead: Lead!
    isApproved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type LeadMember {
    id: ID!
    lead: Lead!
    member: Member!
    createdAt: String!
    updatedAt: String!
  }

  type Feedback {
    id: ID!
    formValueId: ID
    name: String!
    fieldType: FieldType!
    value: JSON!
    Lead: Lead!
    createdAt: String!
    updatedAt: String!
  }

  type LeadFeedback {
    id: ID!
    formName: String!
    leadId: String!
    member: Member!
    memberId: String!
    dependentOnFormName: String
    formValue: [Feedback]!
    dependentOnValue: [Feedback]
    createdAt: String!
    updatedAt: String!
  }

  type Lead {
    id: ID!
    name: String!
    email: String!
    phone: String!
    alternatePhone: String
    rating: Int!
    isLeadConverted: Boolean!
    isFinancedApproved: Boolean!
    callStatus: String!
    paymentStatus: String!
    leadMember: [LeadMember]
    submittedForm: [LeadFeedback]
    company: Company!
    bids: [Bid]
    nextFollowUpDate: String
    department: String
    createdAt: String!
    updatedAt: String!
    leadTransferTo: [LeadTransferTo]
    followUps: [FollowUp]
  }

  type LeadTransferTo {
    lead: Lead
    transferBy: Member!
    transferTo: Member!
    leadData: JSON!
    createdAt: String!
    updatedAt: String!
  }

  type leadResponse {
    lead: Lead
    message: String
  }

  input LeadInput {
    companyId: String!
    name: String!
    email: String!
    phone: String!
    alternatePhone: String
    remark: String!
    department: String
    dynamicFieldValues: JSON
  }

  input FeedbackInput {
    name: String!
    fieldType: FieldType!
    value: JSON
  }
  
  type FollowUp { 
    id: ID!
    nextFollowUpDate: String
    remark: String!
    customerResponse: String
    rating: String
    
    dynamicFieldValues : JSON
    leadId: String
    lead: Lead
    followUpBy: String

    createdAt: String!
    updatedAt: String!
  }
`;
