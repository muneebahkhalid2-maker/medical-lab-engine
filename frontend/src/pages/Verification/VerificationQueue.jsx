import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Save, X, Edit2, FileText, AlertCircle } from 'lucide-react';

export default function VerificationQueue() {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');

  const [document, setDocument] = useState(null);
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchVerificationData();
    } else {
      setLoading(false);
      setDocument(null);
      setExtractions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docRes, extRes] = await Promise.all([
        fetch(`http://localhost:5000/api/documents/${documentId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}` }
        }),
        fetch(`http://localhost:5000/api/documents/${documentId}/extractions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}` }
        })
      ]);

      if (!docRes.ok && !extRes.ok) {
        throw new Error('Document or extraction records not found on backend');
      }

      let docData = null;
      if (docRes.ok) {
        const json = await docRes.json();
        docData = json.data;
        setDocument(docData);
      }

      if (extRes.ok) {
        const json = await extRes.json();
        const extList = (json.data || []).map(ext => ({
          ...ext,
          isEditing: false,
          tempValue: ext.correctedValue || ext.aiValue || ext.rawValue
        }));
        setExtractions(extList);
      } else {
        setExtractions([]);
      }
    } catch (err) {
      console.warn('Verification queue fetch notice:', err.message);
      setError(err.message || 'No live extraction data available for this document.');
      setDocument(null);
      setExtractions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (id, value) => {
    setExtractions(prev => prev.map(e => e._id === id ? { ...e, tempValue: value } : e));
  };

  const toggleEdit = (id, save = false) => {
    setExtractions(prev => prev.map(e => {
      if (e._id === id) {
        if (save) {
          saveExtraction(id, e.tempValue);
        }
        return {
          ...e,
          isEditing: !e.isEditing,
          correctedValue: save ? e.tempValue : e.correctedValue,
          verificationStatus: save ? 'VERIFIED' : e.verificationStatus,
          tempValue: save ? e.tempValue : (e.correctedValue || e.aiValue)
        };
      }
      return e;
    }));
  };

  const saveExtraction = async (id, value) => {
    try {
      await fetch(`http://localhost:5000/api/extractions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({ correctedValue: value })
      });
    } catch (err) {
      console.warn('Extraction save sync notice:', err);
    }
  };

  const handleVerifyAll = async () => {
    if (!documentId || extractions.length === 0) return;
    setSaving(true);
    try {
      await fetch(`http://localhost:5000/api/extractions/document/${documentId}/verify-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}` }
      });
    } catch (err) {
      console.warn('Verify-all sync notice:', err);
    } finally {
      setExtractions(prev => prev.map(e => ({ ...e, verificationStatus: 'VERIFIED', isEditing: false })));
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading verification queue...</div>;

  const verifiedCount = extractions.filter(e => e.verificationStatus === 'VERIFIED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verification Queue</h1>
          <p className="text-slate-500 mt-1">
            {document ? (
              <>Reviewing extractions for <span className="font-semibold text-brand-700">{document?.originalFileName}</span></>
            ) : (
              <>Select a processed document to review extracted clinical parameters.</>
            )}
          </p>
        </div>
        <button
          onClick={handleVerifyAll}
          disabled={saving || extractions.length === 0 || verifiedCount === extractions.length}
          className="btn-primary px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle className="h-5 w-5" />
          {saving ? 'Verifying...' : (extractions.length > 0 && verifiedCount === extractions.length) ? 'All Extractions Verified' : 'Verify & Approve All'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Viewer */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-[650px] shadow-sm">
          <div className="bg-slate-100/70 p-4 border-b border-slate-200/60 font-semibold text-slate-700 flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-brand-600" />
              Document Preview
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-600">
              {document?.documentType || 'DOCUMENT'}
            </span>
          </div>
          <div className="flex-1 bg-slate-200/50 flex flex-col items-center justify-center p-4 text-center">
            {document?.cloudinaryUrl ? (
              <iframe
                src={document.cloudinaryUrl}
                className="w-full h-full rounded-xl border border-slate-300 bg-white"
                title="PDF Document Viewer"
              />
            ) : (
              <div className="bg-white shadow-lg w-full h-full max-w-md rounded-xl p-8 border border-slate-300 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <FileText className="h-16 w-16 text-brand-400" />
                <div>
                  <p className="font-bold text-slate-800 text-base">{document?.originalFileName || 'No Document Selected'}</p>
                  <p className="text-xs text-slate-400 mt-1">Laboratory Report Document</p>
                </div>
                {document && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 text-left w-full space-y-1">
                    <p><strong>Document ID:</strong> {document?._id}</p>
                    <p><strong>Status:</strong> {document?.verificationStatus || 'PENDING'}</p>
                    <p><strong>Uploaded:</strong> {new Date(document?.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Extraction List */}
        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-[650px] shadow-sm">
          <div className="bg-slate-100/70 p-4 border-b border-slate-200/60 font-semibold text-slate-700 flex justify-between items-center">
            <span>Extracted Data Fields</span>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
              {verifiedCount} / {extractions.length} Verified
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {extractions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <AlertCircle className="h-12 w-12 text-slate-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700">No Extracted Parameters Available</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {documentId 
                      ? 'This document has not produced verified extractions yet. Please process the document or upload a clearer scan.'
                      : 'No document ID specified in query parameters.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              extractions.map((field) => (
                <div key={field._id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 transition-all hover:border-brand-300">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900 text-sm">{field.fieldName}</div>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${field.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                      {field.verificationStatus}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 font-medium block mb-1">
                        AI Extracted Value <span className="text-emerald-600 font-semibold">(Conf: {((field.confidence || 0.9) * 100).toFixed(0)}%)</span>
                      </label>
                      {field.isEditing ? (
                        <input
                          type="text"
                          value={field.tempValue}
                          onChange={(e) => handleEditChange(field._id, e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-brand-500 rounded-xl text-sm font-semibold focus:outline-none bg-brand-50/30"
                        />
                      ) : (
                        <div className="text-sm font-extrabold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                          {field.correctedValue || field.aiValue || field.rawValue || 'N/A'}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pt-5">
                      {field.isEditing ? (
                        <>
                          <button onClick={() => toggleEdit(field._id, true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition" title="Save">
                            <Save className="h-4 w-4" />
                          </button>
                          <button onClick={() => toggleEdit(field._id, false)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition" title="Cancel">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => toggleEdit(field._id)} className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition" title="Edit field">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
