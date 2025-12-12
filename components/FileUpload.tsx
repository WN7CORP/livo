import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, PlusCircle, Library } from 'lucide-react';

interface FileUploadProps {
  onAddFiles: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onAddFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Explicitly type 'f' as File to resolve 'property type does not exist on unknown' error
      const filesArray = Array.from(e.target.files).filter((f: File) => f.type === "application/pdf");
      if (filesArray.length > 0) {
        onAddFiles(filesArray);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("Por favor, selecione apenas arquivos PDF.");
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Explicitly type 'f' as File to resolve 'property type does not exist on unknown' error
      const filesArray = Array.from(e.dataTransfer.files).filter((f: File) => f.type === "application/pdf");
      if (filesArray.length > 0) {
        onAddFiles(filesArray);
      } else {
        alert("Por favor, envie apenas arquivos PDF.");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Biblioteca de Extração</h2>
        <p className="text-slate-600">Carregue até 100 livros (PDF) para extração e formatação automática.</p>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="p-4 bg-blue-100 rounded-full mb-4 text-blue-600">
            <Library size={48} />
          </div>
          <p className="text-lg font-medium text-slate-700">
            Arraste seus livros aqui ou clique para selecionar
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Suporta múltiplos arquivos PDF simultaneamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;