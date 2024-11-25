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
    groupedLeads: [groupLeads]
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
    Lead: Lead!
    Member: Member!
    createdAt: String!
    updatedAt: String!
  }

  type Feedback {
    id: ID!
    name: String!
    fieldType: FieldType!
    value: JSON!
    Lead: Lead!
    createdAt: String!
    updatedAt: String!
  }

  type LeadFeedback {
    id: ID!
    leadId: String!
    member: Member!
    memberId: String!
    Lead: Lead!
    imageUrls: [String]

    feedback: [Feedback]!
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
    state: String
    zip: String!
    rating: Int!
    isLeadApproved: Boolean!
    isLeadConverted: Boolean!
    isFinancedApproved: Boolean!
    vehicleDate: String
    vehicleName: String
    vehicleModel: String
    callStatus: String!
    paymentStatus: String!
    LeadMember: [LeadMember]
    LeadFeedback: [LeadFeedback]
    Company: Company!
    bids: [Bid]
    nextFollowUpDate: String
    department: String
    createdAt: String!
    updatedAt: String!
    LeadTransferTo: [LeadTransferTo]
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
    address: String!
    city: String!
    state: String!
    zip: String!
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
    nextFollowUpDate: String!
    remark: String!
    customerResponse: String!
    rating: String!
    
    leadId: String!
    lead: Lead!
    followUpById: String!
    followUpBy: Member!

    createdAt: String!
    updatedAt: String!
  }
`;
