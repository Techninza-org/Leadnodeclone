export const leadSchema = `

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
    state: String!
    zip: String!
    rating: Int!
    vehicleDate: String!
    vehicleName: String!
    vehicleModel: String!
    callStatus: String!
    paymentStatus: String!
    LeadMember: [LeadMember]
    LeadFeedback: [LeadFeedback]
    Company: Company!
    nextFollowUpDate: String
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
    rating: Int
    vehicleDate: String
    vehicleName: String
    vehicleModel: String
  }

  input FeedbackInput {
    name: String!
    fieldType: FieldType!
    value: JSON
  }
    
`;
