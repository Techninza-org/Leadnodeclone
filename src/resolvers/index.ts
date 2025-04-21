import { adminResolvers } from "./adminResolver";
import { authResolvers } from "./authResolver";
import { companyResolvers } from "./companyResolver";
import { leadResolvers } from "./leadResolver";
import { permissionResolvers } from "./permissionResolver";
import { quotationResolvers } from "./quotationResolver";
import { requirementsResolvers } from "./requirementResolver";
import { userResolvers } from "./userResovler";

export const resolvers = {
    ...requirementsResolvers,
    ...authResolvers,
    ...adminResolvers,
    ...leadResolvers,
    ...userResolvers,
    ...companyResolvers,
    ...permissionResolvers,
    ...quotationResolvers,
}