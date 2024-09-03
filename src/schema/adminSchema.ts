export const adminSchema = `
type SubDeptField {
  id: ID!
  name: String!
  fieldType: FieldType!
  value: String
  options: [Options!]
  imgLimit: Int

  order: Int!
  isDisabled: Boolean!
  isRequired: Boolean!

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
  deptFields: [CompanyDeptForm!]
  createdAt: String!
  updatedAt: String!
}

type CreateDeptResponse {
  dept: Dept
}

enum FieldType {
  INPUT
  DATE
  TEXTAREA
  IMAGE
  SELECT
  RADIO
  CHECKBOX
}

type Options {
  label: String!
  value: String!
}

input OptionsInput {
  label: String!
  value: String!
}

input DeptFieldsInput {
  name: String!
  fieldType: FieldType!
  value: String
  order: Int!
  imgLimit: Int
  isDisabled: Boolean
  isRequired: Boolean
  options: [OptionsInput]
}

input CreateDeptInput {
  name: String!
  subDeptName: String!
  order: Int!
  deptFields: [DeptFieldsInput!]
}

`;
