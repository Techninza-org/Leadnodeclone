import { PrismaClient, type Permission as PrismaPermission, PermissionAction } from "@prisma/client"
import type { Permission, UpdateRolePermissionsDto } from "../types/user"
import prisma from "../config/database"

export class PermissionController {
   async createPermission(
      permissionData: Omit<PrismaPermission, "id" | "createdAt" | "updatedAt">,
   ): Promise<Permission> {
      const { name, resource, actions } = permissionData

      const permission = await prisma.permission.create({
         data: {
            name,
            resource,
            actions,
         },
      })

      return this.mapPermissionToFrontendStructure(permission)
   }

   async getPermissions(): Promise<Permission[]> {
      const permissions = await prisma.permission.findMany({
         include: { roles: true },
      })
      return permissions.map(this.mapPermissionToFrontendStructure)
   }

   async getPermissionsByRoleId(roleId: string) {
      const permissions = await prisma.rolePermission.findFirst({
         where: {
            roleId,
            // permission: {
            //    resource: {
            //       equals: resourceName,
            //       mode: "insensitive"
            //    }
            // }
         },
         include: { permission: true },
      })

      return permissions
   }

   async updatePermission(
      id: string,
      permissionData: Partial<Omit<PrismaPermission, "id" | "createdAt" | "updatedAt">>,
   ): Promise<Permission> {
      const permission = await prisma.permission.update({
         where: { id },
         data: permissionData,
      })

      return this.mapPermissionToFrontendStructure(permission)
   }

   async deletePermission(id: string): Promise<void> {
      await prisma.permission.delete({ where: { id } })
   }

   async updateRolePermissions(updateDto: UpdateRolePermissionsDto): Promise<void> {
      const { roleId, permissions } = updateDto

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
         where: { roleId },
      })

      // Create new role permissions
      await prisma.rolePermission.createMany({
         data: permissions.map((p) => ({
            roleId,
            permissionId: p.id,
         })),
      })
   }

   async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
      await prisma.rolePermission.create({
         data: {
            roleId,
            permissionId,
         },
      })
   }

   async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
      await prisma.rolePermission.delete({
         where: {
            roleId_permissionId: {
               roleId,
               permissionId,
            },
         },
      })
   }

   private mapPermissionToFrontendStructure(permission: any): Permission {
      return {
         id: permission.id,
         name: permission.name,
         resource: permission.resource,
         actions: permission.actions,
         createdAt: permission.createdAt,
         updatedAt: permission.updatedAt,
         roles: permission.roles,
         permissions: permission.permissions,
      }
   }
}