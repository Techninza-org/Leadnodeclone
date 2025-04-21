import puppeteer from "puppeteer"
import path from "path"
import fs from "fs-extra"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { htmlToText } from "html-to-text"

export interface QuotationData {
  platformOs: string
  platformAdmin: string
  techDatabase: string
  techApi: string
  techBackend: string
  techApp: string
  budgetAmount: string
  timelineDays: string
  projectRequirements?: string
}

export class DocumentService {
  uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public/uploads/quotations")
    fs.ensureDirSync(this.uploadDir) // Ensure directory exists
  }

  // Replace placeholders in HTML with data
  replacePlaceholders(html: string, data: QuotationData): string {
    let result = html

    // Basic replacements
    result = result.replace(/\$\{data\.platformOs\}/g, data.platformOs || "")
    result = result.replace(/\$\{data\.platformAdmin\}/g, data.platformAdmin || "")
    result = result.replace(/\$\{data\.techDatabase\}/g, data.techDatabase || "")
    result = result.replace(/\$\{data\.techApi\}/g, data.techApi || "")
    result = result.replace(/\$\{data\.techBackend\}/g, data.techBackend || "")
    result = result.replace(/\$\{data\.techApp\}/g, data.techApp || "")
    result = result.replace(/\$\{data\.budgetAmount\}/g, data.budgetAmount || "")
    result = result.replace(/\$\{data\.timelineDays\}/g, data.timelineDays || "")

    // Insert project requirements if they exist
    if (data.projectRequirements && data.projectRequirements.trim()) {
      // Find the project requirements section
      const requirementsSection =
        '<div class="page">' +
        '<div class="content-page">' +
        '<div class="header">' +
        '<img src="https://sooprs.com/images/sooprs_logo.png" alt="Sooprs Logo">' +
        "<h1>VGI Sooprs Technology Pvt Ltd</h1>" +
        "<p>www.sooprs.com | GST No: 06AAKCV5021D1ZM</p>" +
        "</div>" +
        '<div class="content">' +
        "<h2>Project Requirements Details</h2>" +
        '<div class="avoid-break">' +
        data.projectRequirements +
        "</div>" +
        "</div>" +
        '<div class="footer">' +
        '<p>VGI Sooprs Technology Pvt Ltd | <a href="http://www.sooprs.com">www.sooprs.com</a></p>' +
        '<p>Contact: 8178924823 | Email: <a href="mailto:contact@sooprs.com">contact@sooprs.com</a></p>' +
        "</div>" +
        "</div>" +
        "</div>"

      // Insert the requirements section before the budget page
      const budgetPageIndex = result.indexOf("<h2>Budget & Timeline</h2>")
      const budgetPageStart = result.lastIndexOf('<div class="page">', budgetPageIndex)

      if (budgetPageStart !== -1) {
        result = result.substring(0, budgetPageStart) + requirementsSection + result.substring(budgetPageStart)
      }
    }

    return result
  }

  // Resolve relative image paths to absolute paths
  resolveImagePaths(html: string): string {
    const publicDir = path.join(process.cwd(), "public")
    return html.replace(/src="(\/[^"]+)"/g, (match, imagePath) => {
      return `src="${path.join(publicDir, imagePath)}"`
    })
  }

  async generateQuotationPdf(
    htmlContent: string,
    data: QuotationData,
  ): Promise<{ filePath: string; fileName: string }> {
    // Replace placeholders in HTML
    let modifiedHtml = this.replacePlaceholders(htmlContent, data)

    // Resolve image paths
    modifiedHtml = this.resolveImagePaths(modifiedHtml)

    // Generate unique filename
    const fileName = `quotation_${Date.now()}.pdf`
    const filePath = path.join(this.uploadDir, fileName)

    const browser = await puppeteer.launch({
      // @ts-ignore
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()
      await page.setContent(modifiedHtml, {
        waitUntil: "networkidle0",
      })

      // Set PDF options to avoid empty pages
      await page.pdf({
        path: filePath,
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
        displayHeaderFooter: false,
        scale: 1.0,
      })

      return {
        filePath,
        fileName,
      }
    } finally {
      await browser.close()
    }
  }

  async generateQuotationDocx(data: QuotationData): Promise<{ filePath: string; fileName: string }> {
    // Path to template
    const templatePath = path.join(process.cwd(), "templates/quotation_template.docx")

    // Read the template
    const templateContent = fs.readFileSync(templatePath, "binary")
    const zip = new PizZip(templateContent)

    // Process template
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Convert HTML requirements to plain text if needed
    let plainRequirements = data.projectRequirements || ""
    if (data.projectRequirements && data.projectRequirements.includes("<")) {
      plainRequirements = htmlToText(data.projectRequirements, {
        wordwrap: 130,
        preserveNewlines: true,
      })
    }

    // Set template data
    doc.setData({
      platformOs: data.platformOs,
      platformAdmin: data.platformAdmin,
      techDatabase: data.techDatabase,
      techApi: data.techApi,
      techBackend: data.techBackend,
      techApp: data.techApp,
      budgetAmount: data.budgetAmount,
      timelineDays: data.timelineDays,
      projectRequirements: plainRequirements,
    })

    // Render document
    doc.render()

    // Generate output
    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    // Save document
    const fileName = `quotation_${Date.now()}.docx`
    const filePath = path.join(this.uploadDir, fileName)

    fs.writeFileSync(filePath, buf)

    return {
      filePath,
      fileName,
    }
  }
}
