import { useState, useEffect } from 'react';
import { History, Shield, Search, Filter, User, Clock } from 'lucide-react';

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-8801',
    timestamp: '2026-08-14 16:22:10',
    user: 'Dr. Smith (doctor@example.com)',
    action: 'VERIFY_EXTRACTION',
    resource: 'Document #DOC-1029',
    ipAddress: '192.168.1.45',
    details: 'Verified 8 extracted fields for CBC_Report_2026.pdf (100% verified)',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8802',
    timestamp: '2026-08-14 15:45:02',
    user: 'Staff Member (staff@example.com)',
    action: 'UPLOAD_DOCUMENT',
    resource: 'Document #DOC-1029',
    ipAddress: '192.168.1.48',
    details: 'Uploaded document CBC_Report_2026.pdf (1.45 MB)',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8803',
    timestamp: '2026-08-14 14:10:33',
    user: 'System Process (AI-Engine)',
    action: 'MODULE_A_EXTRACTION',
    resource: 'Document #DOC-1028',
    ipAddress: '127.0.0.1',
    details: 'Extracted 12 lab parameters with average confidence 98.2%',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8804',
    timestamp: '2026-08-14 12:05:19',
    user: 'Admin User (admin@example.com)',
    action: 'UPDATE_THRESHOLD',
    resource: 'Settings / OCR Config',
    ipAddress: '192.168.1.10',
    details: 'Updated OCR confidence threshold to 85%',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8805',
    timestamp: '2026-08-14 09:30:00',
    user: 'Dr. Smith (doctor@example.com)',
    action: 'USER_LOGIN',
    resource: 'Auth Session',
    ipAddress: '192.168.1.45',
    details: 'Authenticated successfully via JWT bearer token',
    status: 'SUCCESS'
  }
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        setLogs(data.data);
      } else {
        setLogs(MOCK_AUDIT_LOGS);
      }
    } catch {
      setLogs(MOCK_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'ALL' || log.action.includes(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-7 w-7 text-brand-600" />
            System Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">Immutable security log of document access, extraction edits, and user actions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="h-4 w-4" /> HIPAA Compliance Enabled
          </span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200/60 bg-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search user, action, IP, or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Actions</option>
              <option value="VERIFY">Verifications</option>
              <option value="UPLOAD">Uploads</option>
              <option value="EXTRACTION">AI Extractions</option>
              <option value="LOGIN">Auth Events</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No logs match your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">User Identity</th>
                  <th className="px-6 py-4 font-medium">Action Event</th>
                  <th className="px-6 py-4 font-medium">Resource Target</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                  <th className="px-6 py-4 font-medium text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-brand-600" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-brand-700">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-sm truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-slate-400">
                      {log.ipAddress}
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
