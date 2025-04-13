export const permissionSchema =`
type Permission {
  id: ID!
  name: String!
  resource: String!
  actions: [PermissionAction!]!
  roles: JSON
  createdAt: String!
  updatedAt: String!
}

enum PermissionAction {
  VIEW
  CREATE
  UPDATE
  DELETE
  CRITICAL
}

input CreatePermissionInput {
  name: String!
  resource: String!
  actions: [PermissionAction!]!
}

input UpdatePermissionInput {
  name: String
  resource: String
  actions: [PermissionAction!]
}

input UpdateRolePermissionsInput {
  roleId: ID!
  permissions: [ID!]!
}

`