import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { processFiles } from "./api";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File processing endpoint
  app.post(
    "/api/process-files",
    upload.fields([
      { name: "pdfFiles", maxCount: 10 },
      { name: "emlFiles", maxCount: 10 },
      { name: "xlsxFile", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as {
          pdfFiles?: Express.Multer.File[];
          emlFiles?: Express.Multer.File[];
          xlsxFile?: Express.Multer.File[];
        };

        if (!files || (!files.pdfFiles && !files.emlFiles && !files.xlsxFile)) {
          return res.status(400).json({ 
            success: false, 
            error: "No files uploaded" 
          });
        }

        const pdfFiles = files.pdfFiles || [];
        const emlFiles = files.emlFiles || [];
        const xlsxFile = files.xlsxFile ? files.xlsxFile[0] : undefined;

        // Process files through the Flask API
        const result = await processFiles(pdfFiles, emlFiles, xlsxFile);

        return res.json(result);
      } catch (error) {
        console.error("File processing error:", error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "An unknown error occurred"
        });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
