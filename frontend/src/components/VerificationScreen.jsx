import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Check, AlertCircle, FileText, User } from 'lucide-react';

const VerificationScreen = ({ data: initialData, onComplete }) => {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestChange = (index, field, value) => {
    const updatedTests = [...data.tests];
    
    // Only save AI result if we are changing it for the first time from the original
    if (field === 'result' && updatedTests[index].result !== value && !updatedTests[index].ai_result) {
        updatedTests[index].ai_result = updatedTests[index].result;
    }
    
    updatedTests[index][field] = value;
    
    // If they edit a flagged field, we can assume they verified it
    if (updatedTests[index].needs_verification) {
        updatedTests[index].needs_verification = false;
    }

    setData({ ...data, tests: updatedTests });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post('http://localhost:5000/api/verify', data);
      onComplete(); // Go back to start
    } catch (err) {
      console.error("Failed to save verified data", err);
      alert("Failed to save. Ensure backend is running.");
    } finally {
      setIsSaving(false);
    }
  };

  const imageUrl = data.original_image_path 
    ? `http://localhost:5000/api/uploads/${data.original_image_path}` 
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side: Document View */}
        <div className="bg-slate-100 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-[80vh]">
          <div className="flex items-center text-slate-700 mb-4 font-medium">
            <FileText className="mr-2" size={20} />
            Original Document
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-300 overflow-auto flex items-center justify-center p-4">
            {imageUrl ? (
              <img src={imageUrl} alt="Document" className="max-w-full h-auto shadow-sm" />
            ) : (
              <div className="text-slate-400">No image available</div>
            )}
          </div>
        </div>

        {/* Right Side: Verification Form */}
        <div className="p-6 flex flex-col h-[80vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <Check className="mr-2 text-brand-500" size={24} />
              Verify Extraction
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${data.extraction_status === 'needs_verification' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {data.extraction_status.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 overflow-auto pr-2 space-y-6">
            
            {/* Patient Info Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                <User size={16} className="mr-2" /> Patient Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Name</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue={data.patient?.name || ''} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Age / Sex</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue={`${data.patient?.age || ''} / ${data.patient?.sex || ''}`} />
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Extracted Tests ({data.tests?.length || 0})
              </h3>
              <div className="space-y-4">
                {data.tests?.map((test, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border transition-colors ${test.needs_verification ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-slate-200 hover:border-brand-200 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{test.test_name || test.test_name_raw}</h4>
                        {test.needs_verification && (
                          <div className="flex items-center text-orange-600 text-xs mt-1 font-medium">
                            <AlertCircle size={14} className="mr-1" />
                            Suspicious extraction
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                           Confidence: {(test.confidence * 100).toFixed(0)}%
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Result</label>
                        <input 
                          type="text" 
                          value={test.result || ''} 
                          onChange={(e) => handleTestChange(index, 'result', e.target.value)}
                          className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:outline-none ${test.needs_verification ? 'border-orange-300 focus:ring-orange-200 text-orange-900' : 'border-slate-200 focus:ring-brand-200 text-slate-900'}`}
                        />
                        {test.ai_result && (
                          <div className="text-[10px] text-slate-400 mt-1">AI Output: {test.ai_result}</div>
                        )}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Unit</label>
                        <input 
                          type="text" 
                          value={test.unit || ''} 
                          onChange={(e) => handleTestChange(index, 'unit', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-200 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Ref Range</label>
                        <input 
                          type="text" 
                          value={test.reference_range || ''} 
                          onChange={(e) => handleTestChange(index, 'reference_range', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-slate-200 flex justify-end gap-3">
             <button 
              onClick={onComplete}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-green-300 transition-all transform hover:-translate-y-0.5 flex items-center"
            >
              {isSaving ? 'Saving...' : 'Confirm & Save to DB'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VerificationScreen;
