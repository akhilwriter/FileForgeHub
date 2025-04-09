import React, { useState } from "react";
import { Dropzone } from "@/components/ui/dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidFileType } from "@/lib/utils";

interface FileUploadProps {
  pdfFiles: File[];
  setPdfFiles: React.Dispatch<React.SetStateAction<File[]>>;
  emlFiles: File[];
  setEmlFiles: React.Dispatch<React.SetStateAction<File[]>>;
  xlsxFile: File | null;
  setXlsxFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function FileUpload({
  pdfFiles,
  setPdfFiles,
  emlFiles,
  setEmlFiles,
  xlsxFile,
  setXlsxFile,
}: FileUploadProps) {
  const { toast } = useToast();

  const handlePdfDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      isValidFileType(file, ['pdf'])
    );
    
    if (validFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid file format",
        description: "Some files were not PDFs and were ignored.",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setPdfFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files added",
        description: `${validFiles.length} PDF files added successfully.`,
      });
    }
  };

  const handleEmlDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      isValidFileType(file, ['eml'])
    );
    
    if (validFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid file format",
        description: "Some files were not EML files and were ignored.",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setEmlFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files added",
        description: `${validFiles.length} EML files added successfully.`,
      });
    }
  };

  const handleXlsxDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!isValidFileType(file, ['xlsx'])) {
      toast({
        title: "Invalid file format",
        description: "Please upload a valid XLSX file.",
        variant: "destructive",
      });
      return;
    }
    
    setXlsxFile(file);
    toast({
      title: "File added",
      description: "XLSX file added successfully.",
    });
  };

  const handleRemovePdf = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveEml = (index: number) => {
    setEmlFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveXlsx = () => {
    setXlsxFile(null);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium mb-4">Upload Files</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Dropzone
          title="PDF Files"
          description="Upload multiple PDF files"
          icon={<FileText className="h-10 w-10 text-primary mb-2" />}
          accept={{
            'application/pdf': ['.pdf']
          }}
          onFilesDrop={handlePdfDrop}
          showFileList={true}
          files={pdfFiles}
          onRemoveFile={handleRemovePdf}
        />
        
        <Dropzone
          title="EML Files"
          description="Upload multiple email files"
          icon={<Mail className="h-10 w-10 text-primary mb-2" />}
          accept={{
            'message/rfc822': ['.eml'],
            'application/octet-stream': ['.eml']
          }}
          onFilesDrop={handleEmlDrop}
          showFileList={true}
          files={emlFiles}
          onRemoveFile={handleRemoveEml}
        />
        
        <Dropzone
          title="XLSX File"
          description="Upload a single Excel file"
          icon={<FileSpreadsheet className="h-10 w-10 text-primary mb-2" />}
          accept={{
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
          }}
          onFilesDrop={handleXlsxDrop}
          maxFiles={1}
          showFileList={true}
          files={xlsxFile ? [xlsxFile] : []}
          onRemoveFile={() => handleRemoveXlsx()}
        />
      </div>
    </div>
  );
}
