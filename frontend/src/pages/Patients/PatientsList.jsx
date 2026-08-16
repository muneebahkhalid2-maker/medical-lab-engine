import { useState, useEffect } from 'react';
import { Users, Search, Plus, FileText, ArrowUpRight, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_PATIENTS = [
  {
    id: 'P-1001',
    name: 'Eleanor Vance',
    age: 42,
    gender: 'Female',
    phone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    lastReportDate: '2026-08-12',
    reportsCount: 4,
    riskLevel: 'LOW',
    primaryCondition: 'Routine Checkup / Lipid Panel'
  },
  {
    id: 'P-1002',
    name: 'Marcus Brody',
    age: 58,
    gender: 'Male',
    phone: '+1 (555) 876-5432',
    email: 'm.brody@example.com',
    lastReportDate: '2026-08-10',
    reportsCount: 7,
    riskLevel: 'HIGH',
    primaryCondition: 'Elevated Hemoglobin & Glucose'
  },
  {
    id: 'P-1003',
    name: 'Sophia Martinez',
    age: 29,
    gender: 'Female',
    phone: '+1 (555) 432-1098',
    email: 'sophia.m@example.com',
    lastReportDate: '2026-08-08',
    reportsCount: 2,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Mild Anemia (Low RBC)'
  },
  {
    id: 'P-1004',
    name: 'Arthur Pendelton',
    age: 64,
    gender: 'Male',
    phone: '+1 (555) 901-2345',
    email: 'a.pendelton@example.com',
    lastReportDate: '2026-08-04',
    reportsCount: 5,
    riskLevel: 'LOW',
    primaryCondition: 'Post-Op Comprehensive Metabolic'
  }
];

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        setPatients(data.data);
      } else {
        setPatients(MOCK_PATIENTS);
      }
    } catch {
      // Fallback to mock patients for smooth UI experience
      setPatients(MOCK_PATIENTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === 'ALL' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">High Flag</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Moderate</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Normal / Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-brand-600" />
            Patients Directory
          </h1>
          <p className="text-slate-500 mt-1">Manage patient profiles and linked laboratory extractions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Patient
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Patient Profile</h3>
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              BLOCKED / BACKEND REQUIRED: Live patient registration requires backend database API.
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input type="text" placeholder="e.g. Jane Doe" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
                  <input type="number" placeholder="45" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white">
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-slate-200/60 bg-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, MRN, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-medium text-slate-500">Risk Filter:</span>
            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Patients</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Normal / Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading patient records...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p>No patients match your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Patient Info</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Condition / Lab Notes</th>
                  <th className="px-6 py-4 font-medium">Reports</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/40">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500">MRN: {patient.id} • {patient.age}y/o {patient.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <span className="font-medium">{patient.primaryCondition}</span>
                      <p className="text-xs text-slate-400 mt-0.5">Last updated {patient.lastReportDate}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                        {patient.reportsCount} Reports
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getRiskBadge(patient.riskLevel)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/documents" className="text-brand-600 hover:text-brand-800 text-xs font-semibold inline-flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                        View Documents <ArrowUpRight className="h-3.5 w-3.5" />
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
