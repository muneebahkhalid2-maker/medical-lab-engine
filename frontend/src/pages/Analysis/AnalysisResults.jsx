import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, ArrowDown, ArrowUp, Filter, Search, FileSpreadsheet } from 'lucide-react';

const MOCK_ANALYSIS_DATA = [
  {
    id: 'ANA-901',
    documentName: 'CBC_Complete_Panel_JohnDoe.pdf',
    patientName: 'Marcus Brody (P-1002)',
    date: '2026-08-14',
    category: 'Hematology',
    parameter: 'Hemoglobin (HGB)',
    value: '18.2 g/dL',
    referenceRange: '13.5 - 17.5 g/dL',
    status: 'HIGH',
    confidence: '99%',
    flagReason: 'Exceeds adult male reference range (+0.7 g/dL above maximum threshold)'
  },
  {
    id: 'ANA-902',
    documentName: 'CBC_Complete_Panel_JohnDoe.pdf',
    patientName: 'Marcus Brody (P-1002)',
    date: '2026-08-14',
    category: 'Hematology',
    parameter: 'White Blood Cell Count (WBC)',
    value: '7.4 x10^3 / µL',
    referenceRange: '4.5 - 11.0 x10^3 / µL',
    status: 'NORMAL',
    confidence: '98%',
    flagReason: 'Within normal physiological range'
  },
  {
    id: 'ANA-903',
    documentName: 'Lipid_Panel_Eleanor.pdf',
    patientName: 'Sophia Martinez (P-1003)',
    date: '2026-08-12',
    category: 'Hematology',
    parameter: 'Red Blood Cell Count (RBC)',
    value: '3.8 x10^6 / µL',
    referenceRange: '4.2 - 5.4 x10^6 / µL',
    status: 'LOW',
    confidence: '97%',
    flagReason: 'Below standard female reference range (-0.4 x10^6 below minimum)'
  },
  {
    id: 'ANA-904',
    documentName: 'Metabolic_Panel_Aug2026.pdf',
    patientName: 'Eleanor Vance (P-1001)',
    date: '2026-08-11',
    category: 'Biochemistry',
    parameter: 'Fasting Blood Glucose',
    value: '95 mg/dL',
    referenceRange: '70 - 99 mg/dL',
    status: 'NORMAL',
    confidence: '99%',
    flagReason: 'Optimal fasting range'
  },
  {
    id: 'ANA-905',
    documentName: 'Metabolic_Panel_Aug2026.pdf',
    patientName: 'Eleanor Vance (P-1001)',
    date: '2026-08-11',
    category: 'Biochemistry',
    parameter: 'Serum Potassium (K+)',
    value: '5.6 mmol/L',
    referenceRange: '3.5 - 5.1 mmol/L',
    status: 'HIGH',
    confidence: '96%',
    flagReason: 'Slightly elevated potassium level'
  }
];

export default function AnalysisResults() {
  const [analysisItems, setAnalysisItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/analysis', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        setAnalysisItems(data.data);
      } else {
        setAnalysisItems(MOCK_ANALYSIS_DATA);
      }
    } catch {
      setAnalysisItems(MOCK_ANALYSIS_DATA);
    } finally {
      setLoading(false);
    }
  };

  const filtered = analysisItems.filter(item => {
    const matchesSearch = 
      item.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <ArrowUp className="h-3.5 w-3.5" /> HIGH
        </span>
      );
    }
    if (status === 'LOW') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <ArrowDown className="h-3.5 w-3.5" /> LOW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="h-3.5 w-3.5" /> NORMAL
      </span>
    );
  };

  const highCount = analysisItems.filter(i => i.status === 'HIGH').length;
  const lowCount = analysisItems.filter(i => i.status === 'LOW').length;
  const normalCount = analysisItems.filter(i => i.status === 'NORMAL').length;

  const handleExportCSV = () => {
    const headers = ['ID', 'Parameter', 'Measured Value', 'Reference Range', 'Status', 'Patient', 'Document', 'Flag Reason'];
    const rows = filtered.map(item => [
      item.id,
      `"${item.parameter}"`,
      `"${item.value}"`,
      `"${item.referenceRange}"`,
      item.status,
      `"${item.patientName}"`,
      `"${item.documentName}"`,
      `"${item.flagReason}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Analysis_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-brand-600" />
            Deterministic Analysis Engine
          </h1>
          <p className="text-slate-500 mt-1">Rule-based reference numerical range comparison & flag evaluation</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn-secondary px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm"
        >
          <FileSpreadsheet className="h-4 w-4 text-brand-600" />
          Export Analysis CSV
        </button>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Normal Parameters</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{normalCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Flagged</p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{highCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Flagged</p>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{lowCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <ArrowDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/60 bg-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by parameter, patient, category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="HIGH">High Flags Only</option>
              <option value="LOW">Low Flags Only</option>
              <option value="NORMAL">Normal Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Evaluating analysis parameters...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No analysis parameters match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Extracted Parameter</th>
                  <th className="px-6 py-4 font-medium">Measured Value</th>
                  <th className="px-6 py-4 font-medium">Reference Standard</th>
                  <th className="px-6 py-4 font-medium">Analysis Flag</th>
                  <th className="px-6 py-4 font-medium">Patient / Report</th>
                  <th className="px-6 py-4 font-medium">Interpretation / Deterministic Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/40">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.parameter}</p>
                        <span className="text-xs text-brand-600 bg-brand-50 font-medium px-2 py-0.5 rounded mt-0.5 inline-block border border-brand-100">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-900">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {item.referenceRange}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{item.patientName}</p>
                      <p className="text-slate-400">{item.documentName}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {item.flagReason}
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
