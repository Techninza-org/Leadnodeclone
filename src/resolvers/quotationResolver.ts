import { DocumentService, type QuotationData } from "../services/pdfService"
import fs from "fs-extra"
import path from "path"
import prisma from "../config/database"

const documentService = new DocumentService()

export const quotationResolvers = {
  generateQuotation: async ({
    leadId,
    platform,
    database,
    apiFramework,
    backend,
    app,
    budget,
    timeline,
    format = "pdf",
  }: {
    leadId: string
    platform: string
    database: string
    apiFramework: string
    backend: string
    app: string
    budget: string
    timeline: string
    format?: "pdf" | "docx"
  }) => {
    try {
      // Prepare data for document generation
      const documentData: QuotationData = {
        platformOs: platform,
        platformAdmin: "", // Default value
        techDatabase: database,
        techApi: apiFramework,
        techBackend: backend,
        techApp: app,
        budgetAmount: budget,
        timelineDays: timeline,
      }

      let fileName: string
      let filePath: string

      await prisma.lead.update({
        where: {
          id: leadId
        },
        data: {
          quotationStatus: true
        }
      })

      // Generate document based on requested format
      if (format === "docx") {
        // Generate DOCX
        const result = await documentService.generateQuotationDocx(documentData)
        fileName = result.fileName
        filePath = result.filePath
      } else {
        // Generate PDF (default)
        // Read the template HTML
        const templatePath = path.join(process.cwd(), "templates/quotation.html")
        const htmlContent = await fs.readFile(templatePath, "utf-8")

        // Generate PDF
        const result = await documentService.generateQuotationPdf(htmlContent, documentData)
        fileName = result.fileName
        filePath = result.filePath
      }

      return {
        success: true,
        pdfUrl: `/api/quotations/${fileName}`,
        fileName,
        format,
      }
    } catch (error: any) {
      console.error("Error generating quotation:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}
