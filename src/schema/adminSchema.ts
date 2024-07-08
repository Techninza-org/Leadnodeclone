export const adminSchema = `
type SubDeptField {
  id: ID!
  name: String!
  fieldType: FieldType!
  value: String
  createdAt: String!
  updatedAt: String!

}
type CompanyDeptForm {
  id: ID!
  name: String!
  subDeptFields: [SubDeptField!]
  createdAt: String!
  updatedAt: String!
}

type Dept {
  id: ID!
  name: String!
  members: [Member!]
  companyDeptForms: [CompanyDeptForm!]
  leadStatuses: [leadStatus!]
  createdAt: String!
  updatedAt: String!
}

type CreateDeptResponse {
  dept: Dept
}

enum FieldType {
  INPUT
  TEXTAREA
  IMAGE
  SELECT
  RADIO
  CHECKBOX
}

input DeptFieldsInput {
  name: String!
  fieldType: FieldType!
  value: String
}

input CreateDeptInput {
  name: String!
  subDeptName: String!
  deptFields: [DeptFieldsInput!]
}

`;
