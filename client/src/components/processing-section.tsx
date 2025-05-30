import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSummary } from "@/components/file-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createDownloadFromUrl } from "@/lib/utils";
import { processResponseSchema } from "@shared/schema";

interface ProcessingSectionProps {
  pdfFiles: File[];
  emlFiles: File[];
  xlsxFile: File | null;
  onClearAll: () => void;
}

export function ProcessingSection({
  pdfFiles,
  emlFiles,
  xlsxFile,
  onClearAll,
}: ProcessingSectionProps) {
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  const hasFiles = pdfFiles.length > 0 || emlFiles.length > 0 || xlsxFile !== null;

  const processFiles = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      
      // Append PDF files
      pdfFiles.forEach((file, index) => {
        formData.append(`pdfFiles`, file);
        console.log(`Appended PDF file: ${file.name}`);
      });
      
      // Append EML files
      emlFiles.forEach((file, index) => {
        formData.append(`emlFiles`, file);
        console.log(`Appended EML file: ${file.name}`);
      });
      
      // Append XLSX file
      if (xlsxFile) {
        formData.append('xlsxFile', xlsxFile);
        console.log(`Appended XLSX file: ${xlsxFile.name}`);
      }
      
      const response = await fetch('/api/process-files', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const data = await response.json();
      return processResponseSchema.parse(data);
    },
    onMutate: () => {
      // Start progress simulation
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(current => {
          const newProgress = current + Math.random() * 10;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 300);
      
      return interval;
    },
    onSuccess: (data, _, interval) => {
      clearInterval(interval);
      setProgress(100);
      
      // Determine file type for success message
      let fileType = "CSV";
      if (data.fileName?.endsWith('.xlsx')) fileType = "Excel";
      else if (data.fileName?.endsWith('.xls')) fileType = "Excel";
      else if (data.fileName?.endsWith('.pdf')) fileType = "PDF";
      else if (data.fileName?.endsWith('.txt')) fileType = "text";
      
      toast({
        title: "Success",
        description: `Files processed successfully. A ${fileType} file is ready for download.`,
      });
      
      if (data.binaryData) {
        console.log("Binary data received, creating download...");
        
        setTimeout(() => {
          try {
            // Convert base64 to blob
            const byteCharacters = atob(data.binaryData as string);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: data.contentType || 'text/csv' });
            
            // Create download
            const url = window.URL.createObjectURL(blob);
            const fileName = data.fileName || "processed_data.csv";
            createDownloadFromUrl(url, fileName);
            console.log("Download started from binary data");
            
            // Clean up
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
          } catch (err) {
            console.error("Binary download error:", err);
            toast({
              title: "Download Error",
              description: "Could not create download from the received data.",
              variant: "destructive",
            });
          }
        }, 500);
      } else if (data.downloadUrl) {
        console.log("Download URL received:", data.downloadUrl);
        setTimeout(() => {
          try {
            createDownloadFromUrl(data.downloadUrl as string, "processed_data.csv");
            console.log("Download started from URL");
          } catch (err) {
            console.error("Download error:", err);
            toast({
              title: "Download Error",
              description: "Could not download the result file. Please try the download button again.",
              variant: "destructive",
            });
          }
        }, 500);
      } else {
        console.warn("No download data in API response:", data);
        toast({
          title: "Note",
          description: "Processing complete, but no download data was provided.",
        });
      }
    },
    onError: (error, _, interval) => {
      clearInterval(interval);
      setProgress(0);
      
      toast({
        title: "Error processing files",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleProcessFiles = () => {
    if (!hasFiles) {
      toast({
        title: "No files",
        description: "Please upload at least one file to process",
        variant: "destructive",
      });
      return;
    }
    
    processFiles.mutate();
  };
  
  const resetApp = () => {
    onClearAll();
    processFiles.reset();
    toast({
      title: "Application Reset",
      description: "The application has been reset for new files",
    });
  };

  const downloadResult = () => {
    const data = processFiles.data;
    
    if (data?.binaryData) {
      try {
        console.log("Manual binary download requested");
        
        // Convert base64 to blob
        const byteCharacters = atob(data.binaryData as string);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.contentType || 'text/csv' });
        
        // Create download
        const url = window.URL.createObjectURL(blob);
        const fileName = data.fileName || "processed_data.csv";
        createDownloadFromUrl(url, fileName);
        console.log("Manual download started from binary data");
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } catch (err) {
        console.error("Manual binary download error:", err);
        toast({
          title: "Download Error",
          description: "Could not create download from the received data.",
          variant: "destructive",
        });
      }
    } else if (data?.downloadUrl) {
      try {
        console.log("Manual download requested for URL:", data.downloadUrl);
        createDownloadFromUrl(data.downloadUrl as string, "processed_data.csv");
        console.log("Manual download started from URL");
      } catch (err) {
        console.error("Manual download error:", err);
        toast({
          title: "Download Error",
          description: "Could not download the result file. The URL might be invalid or inaccessible.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Download Available",
        description: "There is no downloadable content available from the API response.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Process Files</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClearAll}
            disabled={processFiles.isPending}
          >
            Clear All
          </Button>
          <Button
            onClick={handleProcessFiles}
            disabled={!hasFiles || processFiles.isPending}
            className="bg-[#4CAF50] hover:bg-[#43a047]"
          >
            {processFiles.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Files"
            )}
          </Button>
        </div>
      </div>
      
      {/* Processing Status */}
      {processFiles.isPending && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <AlertTitle>Processing your files...</AlertTitle>
            </div>
            <span className="text-sm text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-100" />
        </Alert>
      )}
      
      {/* Success Status */}
      {processFiles.isSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start flex-col">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-[#4CAF50] mr-2" />
                <AlertTitle>Processing complete!</AlertTitle>
              </div>
              <AlertDescription className="text-green-700 mt-1 ml-6">
                The updated {processFiles.data?.fileName?.split('.').pop() || 'file'} has been downloaded.
              </AlertDescription>
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={downloadResult}
                size="sm"
                className="h-8 bg-[#4CAF50] hover:bg-[#43a047]"
              >
                Download File Again
              </Button>
              <Button
                onClick={resetApp}
                size="sm"
                className="h-8"
                variant="outline"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Reset App
              </Button>
            </div>
          </div>
        </Alert>
      )}
      
      {/* Error Status */}
      {processFiles.isError && (
        <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <XCircle className="h-4 w-4 text-[#F44336] mr-2 mt-0.5" />
              <div>
                <AlertTitle>Processing failed</AlertTitle>
                <AlertDescription className="text-red-700 mt-1">
                  {processFiles.error?.message || "There was an error processing your files. Please try again."}
                </AlertDescription>
              </div>
            </div>
            <Button
              onClick={resetApp}
              size="sm"
              className="h-8 mt-1"
              variant="outline"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
        </Alert>
      )}
      
      {/* File Summary */}
      <FileSummary 
        pdfCount={pdfFiles.length}
        emlCount={emlFiles.length}
        xlsxCount={xlsxFile ? 1 : 0}
      />
    </div>
  );
}
