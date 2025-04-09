import React from "react";
import { FileText, Mail, FileSpreadsheet } from "lucide-react";

interface FileSummaryProps {
  pdfCount: number;
  emlCount: number;
  xlsxCount: number;
}

export function FileSummary({ pdfCount, emlCount, xlsxCount }: FileSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-medium mb-3">File Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Summary */}
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <span>PDF Files</span>
            </div>
            <span className="bg-gray-100 py-1 px-2 rounded text-sm">{pdfCount}</span>
          </div>
        </div>
        
        {/* EML Summary */}
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-primary mr-2" />
              <span>EML Files</span>
            </div>
            <span className="bg-gray-100 py-1 px-2 rounded text-sm">{emlCount}</span>
          </div>
        </div>
        
        {/* XLSX Summary */}
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-primary mr-2" />
              <span>XLSX Files</span>
            </div>
            <span className="bg-gray-100 py-1 px-2 rounded text-sm">{xlsxCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
