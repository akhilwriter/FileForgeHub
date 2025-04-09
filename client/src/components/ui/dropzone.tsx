import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileIcon, UploadIcon } from "lucide-react";

export interface DropzoneProps extends Omit<DropzoneOptions, "onDrop"> {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onFilesDrop: (acceptedFiles: File[]) => void;
  showFileList?: boolean;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  maxFiles?: number;
}

export function Dropzone({
  className,
  icon,
  title,
  description,
  buttonText = "Select Files",
  onFilesDrop,
  accept,
  showFileList = false,
  files = [],
  onRemoveFile,
  maxFiles,
  ...props
}: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: onFilesDrop,
    accept,
    maxFiles,
    ...props,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps({
          className: cn(
            "border-2 border-dashed border-gray-300 hover:border-primary rounded-lg p-4 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-blue-50",
            className
          ),
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-6">
          {icon || <FileIcon className="h-10 w-10 text-primary mb-2" />}
          <span className="text-lg font-medium mb-1">{title}</span>
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          <Button type="button" size="sm">
            <UploadIcon className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      </div>

      {showFileList && files.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto">
          <h3 className="font-medium text-sm mb-2">Selected Files</h3>
          <ul className="text-sm divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="py-2 flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 text-primary mr-2" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                  </span>
                </div>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(index);
                    }}
                  >
                    &times;
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="text-sm text-red-500 mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((error) => (
                <div key={error.code}>{error.message}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
