import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

/**
 * Modern, Responsive Drag & Drop FileUploader Component
 * 
 * @param {Object} props
 * @param {File|null} props.selectedFile - Currently selected file (controlled)
 * @param {Function} props.onFileSelect - Callback when valid file is selected: (file) => void
 * @param {Function} props.onFileRemove - Callback when file is removed: () => void
 * @param {string[]} props.acceptedExtensions - Allowed file extensions (e.g. ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'])
 * @param {number} props.maxSizeMB - Max allowed file size in Megabytes (default: 20)
 * @param {boolean} props.disabled - Disable input while uploading
 */
export default function FileUploader({
  selectedFile = null,
  onFileSelect,
  onFileRemove,
  acceptedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'],
  maxSizeMB = 20,
  disabled = false
}) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  // Helper to format file size in B, KB, or MB
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get matching icon and colored badge according to file type
  const getFileTypeInfo = (file) => {
    if (!file) return { icon: <File className="w-5 h-5 text-slate-500" />, label: 'FILE', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();

    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return {
        icon: <FileText className="w-6 h-6 text-rose-600" />,
        label: 'PDF',
        bg: 'bg-rose-50 border-rose-200 text-rose-700'
      };
    }
    if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      return {
        icon: <ImageIcon className="w-6 h-6 text-emerald-600" />,
        label: 'IMAGE',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700'
      };
    }
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
      return {
        icon: <FileCode className="w-6 h-6 text-blue-600" />,
        label: 'DOC',
        bg: 'bg-blue-50 border-blue-200 text-blue-700'
      };
    }
    return {
      icon: <File className="w-6 h-6 text-slate-600" />,
      label: 'FILE',
      bg: 'bg-slate-100 border-slate-200 text-slate-700'
    };
  };

  // Validate incoming file
  const validateAndSelectFile = (file) => {
    setValidationError('');
    if (!file) return;

    // 1. Size Validation
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${maxSizeMB}MB.`
      );
      resetNativeInput();
      return;
    }

    // 2. Extension / Format Validation
    const fileName = (file.name || '').toLowerCase();
    const isAllowed = acceptedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
    if (!isAllowed) {
      setValidationError(
        `Unsupported file format "${file.name}". Please upload a supported report format (${acceptedExtensions.join(', ')}).`
      );
      resetNativeInput();
      return;
    }

    // Pass validated file to parent
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  // Drag & drop event listeners
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleNativeInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  // Reset the hidden file input
  const resetNativeInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick remove file action
  const handleRemove = (e) => {
    if (e) e.stopPropagation();
    resetNativeInput();
    setValidationError('');
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const fileType = selectedFile ? getFileTypeInfo(selectedFile) : null;

  return (
    <div className="w-full space-y-3">
      {/* ─── 1. Drag & Drop Upload Zone ─── */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 select-none cursor-pointer
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : ''}
          ${
            dragActive
              ? 'border-brand-500 bg-brand-50/70 scale-[1.01] shadow-md ring-4 ring-brand-500/10'
              : 'border-slate-200 hover:border-brand-400 bg-slate-50/50 hover:bg-white shadow-sm hover:shadow'
          }
          ${validationError ? 'border-rose-300 bg-rose-50/30' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(',')}
          onChange={handleNativeInputChange}
          disabled={disabled}
          className="hidden"
          id="custom-file-uploader-input"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div
            className={`p-3.5 rounded-2xl transition-all duration-200 ${
              dragActive ? 'bg-brand-600 text-white scale-110 shadow-lg' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              <span className="text-brand-600 hover:underline font-extrabold">Click to browse</span> or drag & drop report
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports {acceptedExtensions.join(', ').toUpperCase()} up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. Validation / Format Error Alert ─── */}
      {validationError && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl text-rose-800 text-xs animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium truncate">{validationError}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2.5 py-1 rounded-lg hover:bg-rose-100/50 transition flex-shrink-0 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Clear / Try Again
          </button>
        </div>
      )}

      {/* ─── 3. Selected File Preview Card ─── */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-sm hover:shadow-md transition-all animate-in fade-in duration-150">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${fileType?.bg || 'bg-slate-100'}`}>
              {fileType?.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md">
                  {selectedFile.name}
                </p>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${fileType?.bg}`}>
                  {fileType?.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {formatFileSize(selectedFile.size)} &bull; Ready to upload
              </p>
            </div>
          </div>

          {/* Quick Remove Trash / Cross Action */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            title="Remove selected file"
            className="p-2 text-blue-600 hover:text-red-600 bg-blue-50/60 hover:bg-red-50 border border-blue-200 hover:border-red-200 rounded-lg transition-all duration-150 flex-shrink-0 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
