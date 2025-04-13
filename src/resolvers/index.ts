import { adminResolvers } from "./adminResolver";
import { authResolvers } from "./authResolver";
import { companyResolvers } from "./companyResolver";
import { leadResolvers } from "./leadResolver";
import { permissionResolvers } from "./permissionResolver";
import { userResolvers } from "./userResovler";

export const resolvers = {
    ...authResolvers,
    ...adminResolvers,
    ...leadResolvers,
    ...userResolvers,
    ...companyResolvers,
    ...permissionResolvers
}