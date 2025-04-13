import puppeteer from "puppeteer"
import fs from "fs-extra"
import path from "path"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
} from "docx"

export interface QuotationData {
  platformOs: string
  platformAdmin: string
  techDatabase: string
  techApi: string
  techBackend: string
  techApp: string
  budgetAmount: string
  timelineDays: string
}

export class DocumentService {
  private readonly uploadDir: string
  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads/documents")
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true })
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        fs.mkdirSync(this.uploadDir, { recursive: true })
      } else {
        throw error
      }
    }
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
    // Generate unique filename
    const fileName = `quotation_${Date.now()}.docx`
    const filePath = path.join(this.uploadDir, fileName)

    // Create DOCX document
    const doc = this.createDocxDocument(data)

    // Save document
    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(filePath, buffer)

    return {
      filePath,
      fileName,
    }
  }

  private createDocxDocument(data: QuotationData): Document {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header
            new Paragraph({
              text: "VGI Sooprs Technology Pvt Ltd",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "www.sooprs.com | GST No: 06AAKCV5021D1ZM",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "Project Requirement",
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200,
              },
            }),

            // Platform
            new Paragraph({
              text: "Platform:",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [new TextRun(`1. Mobile App (${data.platformOs})`)],
              bullet: { level: 0 },
            }),
            new Paragraph({
              children: [new TextRun(`2. ${data.platformAdmin}`)],
              bullet: { level: 0 },
            }),

            // Technology
            new Paragraph({
              text: "Technology:",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [new TextRun(`Database: ${data.techDatabase}`)],
              bullet: { level: 0 },
            }),
            new Paragraph({
              children: [new TextRun(`API Framework: ${data.techApi}`)],
              bullet: { level: 0 },
            }),
            new Paragraph({
              children: [new TextRun(`Backend: ${data.techBackend}`)],
              bullet: { level: 0 },
            }),
            new Paragraph({
              children: [new TextRun(`App: ${data.techApp}`)],
              bullet: { level: 0 },
            }),

            // Budget & Timeline
            new Paragraph({
              text: "Budget & Timeline",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            this.createBudgetTable(data),

            // Footer
            new Paragraph({
              text: "",
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "VGI Sooprs Technology Pvt Ltd | www.sooprs.com",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "Contact: 8178924823 | Email: contact@sooprs.com",
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    })
  }

  private createBudgetTable(data: QuotationData): Table {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Item")],
              shading: {
                fill: "007BFF",
                color: "FFFFFF",
              },
            }),
            new TableCell({
              children: [new Paragraph("Details")],
              shading: {
                fill: "007BFF",
                color: "FFFFFF",
              },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Budget")],
            }),
            new TableCell({
              children: [new Paragraph(data.budgetAmount)],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Timeline")],
            }),
            new TableCell({
              children: [new Paragraph(data.timelineDays)],
            }),
          ],
        }),
      ],
    })
  }

  private replacePlaceholders(html: string, data: QuotationData): string {
    // Create a map of placeholders to their values
    const placeholders = {
      "platform-os": data.platformOs,
      "platform-admin": data.platformAdmin,
      "tech-database": data.techDatabase,
      "tech-api": data.techApi,
      "tech-backend": data.techBackend,
      "tech-app": data.techApp,
      "budget-amount": data.budgetAmount,
      "timeline-days": data.timelineDays,
    }

    // Replace each placeholder in the HTML
    let modifiedHtml = html

    // First, remove the script tag that was previously used for injection
    modifiedHtml = modifiedHtml.replace(/<script>[\s\S]*?<\/script>/, "")

    // Then replace each placeholder with its value
    Object.entries(placeholders).forEach(([id, value]) => {
      const regex = new RegExp(`<([^>]+) id="${id}"[^>]*>([^<]*)<\/([^>]+)>`, "g")
      modifiedHtml = modifiedHtml.replace(regex, `<$1 id="${id}">${value}</$3>`)
    })

    // Remove the editable class if present
    modifiedHtml = modifiedHtml.replace(/class="editable"/g, "")

    return modifiedHtml
  }

  // Add a method to handle image paths in the HTML
  private resolveImagePaths(html: string): string {
    // Get the absolute path to the public directory
    const publicDir = path.join(process.cwd(), "public")

    // Replace relative image paths with absolute paths
    const modifiedHtml = html.replace(/src="\.\/([^"]+)"/g, (match, imagePath) => {
      // Check if the image exists in the public directory
      const absolutePath = path.join(publicDir, imagePath)
      if (fs.existsSync(absolutePath)) {
        return `src="file://${absolutePath}"`
      }
      // If not found, try to use an online fallback
      return `src="https://sooprs.com/images/${imagePath}"`
    })

    return modifiedHtml
  }

  async getDocumentStream(fileName: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.uploadDir, fileName)
    if (!(await fs.pathExists(filePath))) {
      throw new Error("Document file not found")
    }
    return fs.createReadStream(filePath)
  }
}
