import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { ProcessingSection } from "@/components/processing-section";

export default function Home() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [emlFiles, setEmlFiles] = useState<File[]>([]);
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);

  const handleClearAll = () => {
    setPdfFiles([]);
    setEmlFiles([]);
    setXlsxFile(null);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Collection Reconciliation</h1>
        <p className="text-gray-600">Upload your PDF, EML, and XLSX files to reconcile your collections</p>
      </header>

      {/* Main Content Area */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <FileUpload
            pdfFiles={pdfFiles}
            setPdfFiles={setPdfFiles}
            emlFiles={emlFiles}
            setEmlFiles={setEmlFiles}
            xlsxFile={xlsxFile}
            setXlsxFile={setXlsxFile}
          />
          
          <ProcessingSection
            pdfFiles={pdfFiles}
            emlFiles={emlFiles}
            xlsxFile={xlsxFile}
            onClearAll={handleClearAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}
