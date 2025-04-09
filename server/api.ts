import axios from "axios";
import FormData from "form-data";
import { ProcessResponse } from "@shared/schema";
import multer from "multer"; // Import multer
import https from "https";

// Define a type for the multer file
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

// Use environment variable for API URL - will be populated by dotenv in index.ts
const getFlaskApiUrl = () => process.env.FLASK_API_URL;

export async function processFiles(
  pdfFiles: MulterFile[],
  emlFiles: MulterFile[],
  xlsxFile?: MulterFile
): Promise<ProcessResponse> {
  try {
    const formData = new FormData();

    // Add PDF files - API expects field name 'pdf'
    pdfFiles.forEach(file => {
      formData.append('pdf', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add EML files - API expects field name 'eml'
    emlFiles.forEach(file => {
      formData.append('eml', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add XLSX file if present - API expects field name 'xlsx'
    if (xlsxFile) {
      formData.append('xlsx', xlsxFile.buffer, {
        filename: xlsxFile.originalname,
        contentType: xlsxFile.mimetype
      });
    }

    // The Flask API URL already includes the full endpoint
    const flaskApiUrl = getFlaskApiUrl();
    if (!flaskApiUrl) {
      throw new Error("Flask API URL is not configured. Please set the FLASK_API_URL environment variable.");
    }
    
    const response = await axios.post<ProcessResponse>(
      flaskApiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          // No API key needed for this API
        },
        responseType: 'json',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Allow self-signed certificates for development
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
      }
    );

    // Ensure the response matches our expected schema
    const processResponse: ProcessResponse = {
      success: response.data.success || false,
      downloadUrl: response.data.downloadUrl,
      message: response.data.message,
      error: response.data.error
    };
    
    return processResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: error.config?.url,
        responseData: error.response?.data
      });
      
      // Handle specific error cases
      const apiUrl = getFlaskApiUrl();
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Unable to connect to the API server at ${apiUrl}. Please ensure the server is running.`);
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        throw new Error(`SSL certificate issue when connecting to the API. This might be due to a self-signed certificate.`);
      } else {
        throw new Error(
          error.response?.data?.message ||
          error.message ||
          "Error processing files"
        );
      }
    }
    console.error("Unknown error during API request:", error);
    throw error;
  }
}
