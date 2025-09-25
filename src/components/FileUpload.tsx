import React, { useRef, useState } from 'react';
import { Upload, File, X, Check, Link, Globe } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  onLinksChange: (links: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  onLinksChange,
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'],
  maxSizeInMB = 10,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxSizeInMB}MB.`);
        return;
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        alert(`File type "${fileExtension}" is not supported.`);
        return;
      }

      // Check max files limit
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      const uploadedFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'uploading'
      };

      newFiles.push(uploadedFile);
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Simulate upload process
      newFiles.forEach((uploadedFile) => {
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, status: 'success' }
                : f
            )
          );
        }, 1000 + Math.random() * 2000);
      });

      // Update parent component
      const allFiles = [...uploadedFiles.map(f => f.file), ...newFiles.map(f => f.file)];
      onFilesChange(allFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      onFilesChange(updated.map(f => f.file));
      return updated;
    });
  };

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      const updatedLinks = [...links, newLink.trim()];
      setLinks(updatedLinks);
      setNewLink('');
      onLinksChange(updatedLinks);
    }
  };

  const removeLink = (linkToRemove: string) => {
    const updatedLinks = links.filter(link => link !== linkToRemove);
    setLinks(updatedLinks);
    onLinksChange(updatedLinks);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Documents
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Choose files
              </button>
              <span> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.join(', ')} up to {maxSizeInMB}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'uploading' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                  )}
                  {uploadedFile.status === 'success' && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website/Reference Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website & Reference Links
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
              placeholder="https://example.com or docs link"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addLink}
            disabled={!newLink.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Add
          </button>
        </div>
        
        {links.length > 0 && (
          <div className="mt-3 space-y-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:text-emerald-700 truncate"
                  >
                    {link}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(link)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;