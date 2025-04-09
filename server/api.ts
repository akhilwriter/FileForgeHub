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
    console.log("API processFiles called with:", {
      pdfCount: pdfFiles.length,
      emlCount: emlFiles.length,
      hasXlsx: !!xlsxFile
    });
    
    const formData = new FormData();

    // Add PDF files - API expects field name 'pdf'
    pdfFiles.forEach(file => {
      console.log(`Adding PDF file to formData: ${file.originalname}`);
      formData.append('pdf', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add EML files - API expects field name 'eml'
    emlFiles.forEach(file => {
      console.log(`Adding EML file to formData: ${file.originalname}`);
      formData.append('eml', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    // Add XLSX file if present - API expects field name 'xlsx'
    if (xlsxFile) {
      console.log(`Adding XLSX file to formData: ${xlsxFile.originalname}`);
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
    
    console.log(`Sending request to Flask API: ${flaskApiUrl}`);
    
    const response = await axios.post(
      flaskApiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          // No API key needed for this API
        },
        responseType: 'arraybuffer', // Change to binary response type
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Allow self-signed certificates for development
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
      }
    );

    console.log("Flask API response received:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      isArrayBuffer: response.data instanceof ArrayBuffer
    });

    // Check if the response is a successful binary response (like CSV data)
    if (
      response.status === 200 && 
      response.data instanceof ArrayBuffer && 
      (
        response.headers['content-type']?.includes('text/csv') ||
        response.headers['content-type']?.includes('application/octet-stream')
      )
    ) {
      // Convert the binary data to base64 to pass it to the client
      const buffer = Buffer.from(response.data);
      const base64Data = buffer.toString('base64');

      // Return success with the binary data
      const processResponse: ProcessResponse = {
        success: true,
        binaryData: base64Data,
        contentType: response.headers['content-type'] || 'text/csv',
        fileName: 'processed_data.csv'
      };
      
      return processResponse;
    }
    
    // Try to parse as JSON if it's not binary data
    try {
      const textData = Buffer.from(response.data).toString('utf-8');
      const jsonData = JSON.parse(textData);
      
      console.log("API returned JSON:", jsonData);
      
      // Return error response
      const processResponse: ProcessResponse = {
        success: jsonData.success || false,
        message: jsonData.message,
        error: jsonData.error
      };
      
      return processResponse;
    } catch (e) {
      console.log("Response is neither valid binary data nor JSON");
      
      // If we get here, we couldn't parse as JSON or recognize as binary
      const errorResponse: ProcessResponse = {
        success: false,
        error: "Received unexpected response format from the API"
      };
      
      console.log("Processed response:", errorResponse);
      return errorResponse;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: error.config?.url,
        responseData: error.response?.data instanceof Buffer ? 'Binary data' : error.response?.data
      });
      
      // Handle specific error cases
      const apiUrl = getFlaskApiUrl();
      let errorMessage = "Error processing files";
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Unable to connect to the API server at ${apiUrl}. Please ensure the server is running.`;
      } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        errorMessage = `SSL certificate issue when connecting to the API. This might be due to a self-signed certificate.`;
      } else if (error.response?.data) {
        try {
          if (error.response.data instanceof Buffer) {
            const textData = error.response.data.toString('utf-8');
            try {
              const jsonData = JSON.parse(textData);
              errorMessage = jsonData.message || jsonData.error || "API error: " + error.message;
            } catch (e) {
              // Not valid JSON
              errorMessage = textData.slice(0, 100) || "API error: " + error.message;
            }
          } else {
            errorMessage = error.response.data.message || error.response.data.error || error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    console.error("Unknown error during API request:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
