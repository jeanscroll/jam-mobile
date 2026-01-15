import React from "react";
import { useRef, useState } from "react";
import { cn } from "../../../lib/utils";

interface FileUploaderProps {
  state?: "default" | "hover" | "uploading" | "failed" | "complete" | "disabled";
  onFileSelect?: (file: File) => void;
  accept?: string;
  maxSize?: number;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const FileUploader = ({
  state = "default",
  onFileSelect,
  accept = "*/*",
  maxSize = 5242880, // 5MB
}: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    if (file.size > maxSize) {
      alert("File is too large");
      return;
    }
    onFileSelect?.(file);
  };

  const getStateStyles = () => {
    switch (state) {
      case "uploading":
        return "border-blue-400 bg-blue-50";
      case "complete":
        return "border-green-400 bg-green-50";
      case "failed":
        return "border-red-400 bg-red-50";
      case "disabled":
        return "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed";
      default:
        return dragActive
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400";
    }
  };

  return (
    <div
      className={cn(
        "relative p-6 border-2 border-dashed rounded-lg transition-colors bg-gray-50",
        getStateStyles()
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}  
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept={accept}
        disabled={state === "disabled"}
      />
      
      <div className="text-center flex flex-col items-center">
        <div className="bg-white rounded-full p-4 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4 4C4 2.34315 5.34315 1 7 1H15.7574C16.553 1 17.3161 1.31607 17.8787 1.87868L21.1213 5.12132C21.6839 5.68393 22 6.44699 22 7.24264V20C22 21.6569 20.6569 23 19 23H7C5.34315 23 4 21.6569 4 20V4Z" fill="#0A3D00" />
            <path fillRule="evenodd" clipRule="evenodd" d="M14 3V7.24264C14 7.7949 14.2107 8.3251 14.5858 8.70021L15.2929 9.40731C15.6834 9.79784 16.2206 10 16.7803 10H21V8H16.7803L16 7.24264V3H14Z" fill="#0A3D00" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2 text-gray-900">Importer ou déposer un fichier</h3>
        <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX, JPG (max. 2Mo)</p>
        
        {state === "uploading" && (
          <div className="mb-2">
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full w-1/2"></div>
            </div>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state === "disabled"}
          className={cn(
            "text-sm font-medium",
            state === "disabled" ? "text-gray-400" : "text-blue-600"
          )}
        >
          Click to upload
        </button>
        <span className="text-sm text-gray-500"> or drag and drop</span>
      </div>
    </div>
  );
};

export default FileUploader;