import { useState } from 'react';
import UploadScreen from './UploadScreen';
import VerificationScreen from './VerificationScreen';

export default function LegacyUploadFlow() {
  const [extractedData, setExtractedData] = useState(null);

  const handleUploadComplete = (data) => {
    setExtractedData(data);
  };

  const handleVerificationComplete = () => {
    setExtractedData(null); // Reset to upload screen
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <span className="text-blue-500 mr-2">⚕️</span>
            MedExtract (Legacy OCR)
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!extractedData ? (
          <UploadScreen onUploadComplete={handleUploadComplete} />
        ) : (
          <VerificationScreen 
            data={extractedData} 
            onComplete={handleVerificationComplete} 
          />
        )}
      </main>
    </div>
  );
}
