import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuotationData } from "../services/pdfService";
import fs from "fs-extra";
import path from "path";
import prisma from "../config/database";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");



export const generateRequirementsController = async (req: any, res: any) => {
  try {
    const response = await requirementsResolvers.generateRequirements(req.body);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate requirements.' });
  }
}

export const requirementsResolvers = {
  generateRequirements: async ({
    projectType,
    userPrompt
  }: {
    projectType: string;
    userPrompt?: string;
  }) => {
    console.log(projectType,
      userPrompt
    )
    try {
      // Create a model instance
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Generate base prompt based on project type
      let basePrompt = `Generate professional and detailed project requirements for a ${projectType} project. 
      Include sections for:
      1. Overview
      2. Core Features
      3. Technical Specifications
      4. User Flow
      5. Security Requirements
      
      Format the output as clean HTML that can be directly embedded in a PDF document.
      Make the requirements specific, actionable, and professionally written.
      
      
      all should cover within 300 words.`;

      // Add user prompt if provided
      if (userPrompt && userPrompt.trim()) {
        basePrompt += `\n\nAdditional requirements: ${userPrompt}`;
      }

      // Generate content
      const result = await model.generateContent(basePrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
      };
    } catch (error: any) {
      console.error("Error generating requirements with Gemini:", error);
      return {
        success: false,
        error: error.message || "Failed to generate requirements",
      };
    }
  },
};