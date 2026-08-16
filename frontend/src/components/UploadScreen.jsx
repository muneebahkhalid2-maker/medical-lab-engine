import { useState, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadScreen = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    files.forEach(f => formData.append('documents', f));

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadComplete(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to process document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto mt-12"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-800">Upload Lab Report</h2>
          <p className="text-slate-500 mt-2">We support JPEG, PNG, PDF, and DOCX formats.</p>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out
            ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
            ${file ? 'border-green-500 bg-green-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-4 rounded-full ${files.length > 0 ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'}`}>
              <UploadCloud size={32} />
            </div>
            {files.length > 0 ? (
              <div>
                <p className="text-lg font-medium text-slate-700">{files.length} file(s)</p>
                <p className="text-sm text-slate-500">Ready to extract</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-slate-700">
                  Drag & drop your files here
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center min-w-[140px]
              ${(files.length === 0 || isUploading) 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200 hover:shadow-brand-300 transform hover:-translate-y-0.5'
              }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Extracting...
              </>
            ) : (
              'Start Extraction'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadScreen;
