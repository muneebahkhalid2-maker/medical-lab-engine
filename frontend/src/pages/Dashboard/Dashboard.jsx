import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Upload, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_RECENT_DOCS = [
  {
    _id: 'doc-101',
    originalFileName: 'CBC_Complete_Panel_JohnDoe.pdf',
    patient: 'Marcus Brody (P-1002)',
    createdAt: new Date().toISOString(),
    verificationStatus: 'PENDING'
  },
  {
    _id: 'doc-102',
    originalFileName: 'Lipid_Panel_EleanorVance.pdf',
    patient: 'Eleanor Vance (P-1001)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    verificationStatus: 'VERIFIED'
  },
  {
    _id: 'doc-103',
    originalFileName: 'Metabolic_Panel_Aug2026.pdf',
    patient: 'Sophia Martinez (P-1003)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    verificationStatus: 'VERIFIED'
  }
];

export default function Dashboard() {
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDocs();
  }, []);

  const fetchRecentDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        setRecentDocs(data.data.slice(0, 5));
      } else {
        setRecentDocs(MOCK_RECENT_DOCS);
      }
    } catch {
      setRecentDocs(MOCK_RECENT_DOCS);
    } finally {
      setLoading(false);
    }
  };

  const STATS = [
    { label: 'Total Documents', value: '1,248', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Processing Queue', value: '12', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Needs Verification', value: '34', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Analysis Complete', value: '842', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Medical laboratory document processing and deterministic analysis pipeline</p>
        </div>
        <Link to="/documents/upload" className="btn-primary px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
          <Upload className="h-4 w-4" />
          Upload Report
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/patients" className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all group shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Patients Directory</h4>
            <p className="text-xs text-slate-500 mt-0.5">Manage patient files & report histories</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/analysis" className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all group shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Analysis Results</h4>
            <p className="text-xs text-slate-500 mt-0.5">View numerical reference range flags</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/verification" className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all group shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Verification Queue</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium text-rose-600">34 items awaiting audit</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Documents Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200/60 flex justify-between items-center bg-white/60">
          <h2 className="text-lg font-bold text-slate-900">Recent Documents</h2>
          <Link to="/documents" className="text-brand-600 hover:text-brand-700 text-xs font-semibold flex items-center gap-1">
            View All Documents <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading recent documents...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/60 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Document</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Verification</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/40">
                {recentDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-600" />
                      {doc.originalFileName}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{doc.patient || doc.uploadedBy?.name || 'Marcus Brody (P-1002)'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {doc.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <AlertCircle className="h-3 w-3" /> Needs Verification
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-semibold">
                      <Link to={`/verification?documentId=${doc._id}`} className="text-brand-600 hover:text-brand-800 inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
