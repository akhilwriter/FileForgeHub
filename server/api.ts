import axios from "axios";
import FormData from "form-data";
import { ProcessResponse } from "@shared/schema";

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5001";

export async function processFiles(
  pdfFiles: Express.Multer.File[],
  emlFiles: Express.Multer.File[],
  xlsxFile?: Express.Multer.File
): Promise<ProcessResponse> {
  try {
    const formData = new FormData();

    // Add PDF files
    pdfFiles.forEach(file => {
      formData.append('pdfFiles', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add EML files
    emlFiles.forEach(file => {
      formData.append('emlFiles', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add XLSX file if present
    if (xlsxFile) {
      formData.append('xlsxFile', xlsxFile.buffer, {
        filename: xlsxFile.originalname,
        contentType: xlsxFile.mimetype
      });
    }

    const response = await axios.post<ProcessResponse>(
      `${FLASK_API_URL}/process`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'json',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Error processing files"
      );
    }
    throw error;
  }
}
