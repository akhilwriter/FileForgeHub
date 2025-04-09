import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSummary } from "@/components/file-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
      });
      
      // Append EML files
      emlFiles.forEach((file, index) => {
        formData.append(`emlFiles`, file);
      });
      
      // Append XLSX file
      if (xlsxFile) {
        formData.append('xlsxFile', xlsxFile);
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
      
      toast({
        title: "Success",
        description: "Files processed successfully",
      });
      
      if (data.downloadUrl) {
        setTimeout(() => {
          createDownloadFromUrl(data.downloadUrl, "processed_data.csv");
        }, 500);
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

  const downloadResult = () => {
    if (processFiles.data?.downloadUrl) {
      createDownloadFromUrl(processFiles.data.downloadUrl, "processed_data.csv");
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
          <Progress value={progress} className="h-2 bg-blue-100" indicatorClassName="bg-primary" />
        </Alert>
      )}
      
      {/* Success Status */}
      {processFiles.isSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#4CAF50] mr-2" />
              <AlertTitle>Processing complete!</AlertTitle>
            </div>
            <Button 
              onClick={downloadResult}
              size="sm"
              className="h-8 bg-[#4CAF50] hover:bg-[#43a047]"
            >
              Download CSV
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Error Status */}
      {processFiles.isError && (
        <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
          <div className="flex items-start">
            <XCircle className="h-4 w-4 text-[#F44336] mr-2 mt-0.5" />
            <div>
              <AlertTitle>Processing failed</AlertTitle>
              <AlertDescription className="text-red-700 mt-1">
                {processFiles.error?.message || "There was an error processing your files. Please try again."}
              </AlertDescription>
            </div>
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
