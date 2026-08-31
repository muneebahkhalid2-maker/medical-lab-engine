import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  ArrowUpRight, 
  Phone, 
  Mail, 
  Eye, 
  Upload, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  Sparkles, 
  Loader2,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MOCK_PATIENTS = [
  {
    _id: '60c72b2f9b1d8b0015b6d914',
    patientId: 'P-1004',
    name: 'Areeba Shahid',
    age: 24,
    gender: 'Female',
    sex: 'Female',
    phone: '+92 (300) 9988776',
    contactPhone: '+92 (300) 9988776',
    email: 'areeba.shahid@example.com',
    contactEmail: 'areeba.shahid@example.com',
    address: 'Rawalpindi Cantonment, Pakistan',
    lastReportDate: '31-Aug-2026',
    reportsCount: 1,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Lymphocytosis & Microcytic Anemia (AFIP / CMH Report)',
    encounterStatus: 'VERIFICATION_COMPLETE',
    extractedRecords: [
      { panel: 'Chemical Pathology - LFT', test: 'Total Bilirubin', result: '14', unit: 'umol/L', range: 'Upto 20.5 umol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - LFT', test: 'ALT / SGPT', result: '31', unit: 'U/L', range: 'Adults upto 42 U/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - LFT', test: 'Alkaline Phosphatase (ALP)', result: '221.2', unit: 'U/L', range: '110 - 310 U/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Blood Urea', result: '3.9', unit: 'mmol/L', range: '2.5 - 7.1 mmol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Creatinine', result: '29', unit: 'umol/L', range: '26 - 60 umol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Sodium (Na+)', result: '139', unit: 'mmol/L', range: '135 - 148 mmol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Potassium (K+)', result: '4.6', unit: 'mmol/L', range: '3.5 - 5.1 mmol/L', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Urine Colour', result: 'Pale Yellow', unit: 'N/A', range: 'Pale Yellow', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Specific Gravity', result: '1.015', unit: 'N/A', range: '1.005 - 1.030', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Reaction (pH)', result: 'Acidic', unit: 'N/A', range: 'Acidic', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Protein / Albumin', result: 'Nil', unit: 'N/A', range: 'Nil', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Glucose / Sugar', result: 'Nil', unit: 'N/A', range: 'Nil', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Pus Cells / WBC', result: '0 - 2', unit: '/HPF', range: '0 - 5 /HPF', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Red Blood Cells (RBCs)', result: 'Nil', unit: '/HPF', range: '0 - 2 /HPF', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Epithelial Cells', result: 'Few', unit: '/HPF', range: 'Few /HPF', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Hemoglobin (Hb)', result: '12.4', unit: 'g/dL', range: '12.0 - 14.0 g/dL', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Total Leukocyte Count (TLC)', result: '6.9', unit: 'x10^9/L', range: '4.0 - 11.0 x10^9/L', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Neutrophils', result: '40', unit: '%', range: '40 - 75 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Lymphocytes', result: '52', unit: '%', range: '20 - 45 %', status: 'HIGH' },
      { panel: 'Hematology - CBC', test: 'Eosinophils', result: '05', unit: '%', range: '2 - 10 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Monocytes', result: '03', unit: '%', range: '1 - 6 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Basophils', result: '00', unit: '%', range: '0 - 1 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Platelet Count', result: '294', unit: 'x10^9/L', range: '150 - 450 x10^9/L', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Mean Corpuscular Volume (MCV)', result: '65.8', unit: 'fL', range: '76.0 - 96.0 fL', status: 'LOW' },
      { panel: 'Hematology - CBC', test: 'Hematocrit (PCV)', result: '35.1', unit: '%', range: '36.0 - 46.0 %', status: 'LOW' }
    ]
  },
  {
    _id: '60c72b2f9b1d8b0015b6d913',
    patientId: '145104',
    name: 'M Afzal',
    age: 64,
    gender: 'Male',
    sex: 'Male',
    phone: '+92 (300) 555-0199',
    contactPhone: '+92 (300) 555-0199',
    email: 'm.afzal@cardiac.org',
    contactEmail: 'm.afzal@cardiac.org',
    address: 'NHQ, Lahore Cantonment, Pakistan',
    lastReportDate: '08-Jul-2026',
    reportsCount: 2,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Cardiac & Lipid Evaluation (Army Cardiac Center Lahore)',
    encounterStatus: 'VERIFICATION_COMPLETE',
    extractedRecords: [
      { panel: 'Liver Function Test', test: 'Serum Total Bilirubin', result: '06', unit: 'umol/l', range: '2 - 17 umol/l', status: 'NORMAL' },
      { panel: 'Liver Function Test', test: 'Serum ALT', result: '22', unit: 'u/l', range: 'upto 42 u/l', status: 'NORMAL' },
      { panel: 'Trop I Hs', test: 'Trop I Hs', result: '0.02', unit: 'ng/ml', range: '0.02 - 0.06 ng/ml', status: 'NORMAL' },
      { panel: 'RFTs', test: 'Urea', result: '42', unit: 'mg/dl', range: '18 - 42 mg/dl', status: 'NORMAL' },
      { panel: 'RFTs', test: 'Serum Creatinine', result: '1.6', unit: 'mg/dl', range: 'Male = 0.7 - 1.2 mg/dl\nFemale = 0.6 - 1.1 mg/dl', status: 'HIGH' },
      { panel: 'RFTs', test: 'Serum Sodium', result: '139', unit: 'mmol/l', range: '135 - 150 mmol/l', status: 'NORMAL' },
      { panel: 'RFTs', test: 'Serum Potassium', result: '4.6', unit: 'mmol/l', range: '3.4 - 5.0 mmol/l', status: 'NORMAL' },
      { panel: 'Lipid Profile', test: 'Serum Chloesterol', result: '99', unit: 'mg/dl', range: 'Desireable = <200\nHigh = >240', status: 'NORMAL' },
      { panel: 'Lipid Profile', test: 'Serum Triglycerides', result: '69', unit: 'mg/dl', range: 'Desireable = < 150\nHigh = > 200', status: 'NORMAL' },
      { panel: 'Diabetec Profile', test: 'HBA1C', result: '6.1', unit: '%', range: '4.2 - 6.5 %', status: 'NORMAL' }
    ]
  },
  {
    _id: '60c72b2f9b1d8b0015b6d911',
    patientId: 'P-1001',
    name: 'Eleanor Vance',
    age: 42,
    gender: 'Female',
    sex: 'Female',
    phone: '+1 (555) 234-5678',
    contactPhone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    contactEmail: 'eleanor.vance@example.com',
    address: '742 Evergreen Terrace, Springfield',
    lastReportDate: '12-Aug-2026',
    reportsCount: 4,
    riskLevel: 'LOW',
    primaryCondition: 'Routine Checkup / Lipid Panel',
    encounterStatus: 'VERIFICATION_COMPLETE',
    extractedRecords: [
      { panel: 'Complete Blood Count', test: 'Hemoglobin', result: '14.2', unit: 'g/dL', range: '12.0 - 16.0 g/dL', status: 'NORMAL' },
      { panel: 'Lipid Profile', test: 'Total Cholesterol', result: '185', unit: 'mg/dL', range: '< 200 mg/dL', status: 'NORMAL' }
    ]
  },
  {
    _id: '60c72b2f9b1d8b0015b6d912',
    patientId: 'P-1002',
    name: 'Marcus Brody',
    age: 58,
    gender: 'Male',
    sex: 'Male',
    phone: '+1 (555) 876-5432',
    contactPhone: '+1 (555) 876-5432',
    email: 'm.brody@example.com',
    contactEmail: 'm.brody@example.com',
    address: '123 Baker Street, London',
    lastReportDate: '10-Aug-2026',
    reportsCount: 7,
    riskLevel: 'HIGH',
    primaryCondition: 'Elevated Hemoglobin & Glucose',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    extractedRecords: [
      { panel: 'Diabetic Profile', test: 'HbA1c', result: '7.8', unit: '%', range: '4.0 - 5.6 %', status: 'HIGH' },
      { panel: 'Metabolic', test: 'Fasting Glucose', result: '142', unit: 'mg/dL', range: '70 - 99 mg/dL', status: 'HIGH' }
    ]
  },
  {
    _id: '60c72b2f9b1d8b0015b6d914',
    patientId: 'P-1003',
    name: 'Sophia Martinez',
    age: 29,
    gender: 'Female',
    sex: 'Female',
    phone: '+1 (555) 432-1098',
    contactPhone: '+1 (555) 432-1098',
    email: 'sophia.m@example.com',
    contactEmail: 'sophia.m@example.com',
    address: '88 Ocean View, San Diego',
    lastReportDate: '08-Aug-2026',
    reportsCount: 2,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Mild Anemia (Low RBC)',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    extractedRecords: [
      { panel: 'Complete Blood Count', test: 'RBC Count', result: '3.6', unit: 'M/uL', range: '4.2 - 5.4 M/uL', status: 'LOW' },
      { panel: 'Iron Panel', test: 'Serum Ferritin', result: '18', unit: 'ng/mL', range: '20 - 200 ng/mL', status: 'LOW' }
    ]
  }
];

import { getAllPatients, registerNewPatient, onPatientsUpdated } from '../../services/patientService';

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingPatientRecords, setViewingPatientRecords] = useState(null);

  // New patient registration form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    sex: 'Female',
    phone: '',
    email: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
    const unsubscribe = onPatientsUpdated((updatedList) => {
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        setPatients(updatedList);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      console.warn('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const created = await registerNewPatient(newPatient);
      setPatients(prev => [created, ...prev.filter(p => p.patientId !== created.patientId)]);
      setModalSuccess('Patient profile created & saved successfully across system!');
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
        setNewPatient({ name: '', age: '', sex: 'Female', phone: '', email: '', address: '' });
      }, 1000);
    } catch (err) {
      console.error('Error creating patient:', err);
      setModalError('Failed to save patient profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const pName = patient.name || '';
    const pId = patient.patientId || patient.id || patient._id || '';
    const pEmail = patient.contactEmail || patient.email || '';
    const q = searchTerm.toLowerCase();

    const matchesSearch = 
      pName.toLowerCase().includes(q) ||
      pId.toLowerCase().includes(q) ||
      pEmail.toLowerCase().includes(q);
    
    const pRisk = patient.riskLevel || 'LOW';
    const matchesRisk = filterRisk === 'ALL' || pRisk === filterRisk;
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Patients Directory
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage patient profiles, saved laboratory reports, and AI extracted diagnostic records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/intake"
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-2 text-xs"
          >
            <Upload className="h-4 w-4" />
            Intake & Upload Report
          </Link>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Patient
          </button>
        </div>
      </div>

      {/* ADD NEW PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Patient Profile</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {modalSuccess}
              </div>
            )}

            {modalError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. M Afzal" 
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="120"
                    placeholder="e.g. 64" 
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={newPatient.sex}
                    onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +92 (300) 555-0199" 
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. patient@example.com" 
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lahore Cantonment, Pakistan" 
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EXTRACTED LAB DATA & RECORDS MODAL */}
      {viewingPatientRecords && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {viewingPatientRecords.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{viewingPatientRecords.name} • Lab Records & Analysis</h3>
                    <p className="text-xs text-slate-400">
                      ID: <span className="font-mono text-slate-700 font-bold">{viewingPatientRecords.patientId || viewingPatientRecords.id}</span> • Age: {viewingPatientRecords.age} ({viewingPatientRecords.gender || viewingPatientRecords.sex})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPatientRecords(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Meta Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Condition / Lab Notes</span>
                  <span className="text-xs font-bold text-blue-800">{viewingPatientRecords.primaryCondition || 'General Evaluation'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Last Report Date</span>
                  <span className="text-xs font-bold text-slate-800">{viewingPatientRecords.lastReportDate || 'Recently Verified'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Clinical Risk Level</span>
                    <span className="text-xs font-bold">{getRiskBadge(viewingPatientRecords.riskLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Extracted Parameters Table */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    Verified Extracted Parameters ({viewingPatientRecords.extractedRecords?.length || (viewingPatientRecords.latestAnalysis?.tests?.length || 10)} Parameters)
                  </span>
                  <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                    Army Cardiac / Standard 4-Tier Reference
                  </span>
                </div>

                <div className="max-h-[280px] overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                  {(viewingPatientRecords.extractedRecords || viewingPatientRecords.latestAnalysis?.tests || [
                    { panel: 'Liver Function Test', test: 'Serum Total Bilirubin', result: '06', unit: 'umol/l', range: '2 - 17 umol/l', status: 'NORMAL' },
                    { panel: 'Liver Function Test', test: 'Serum ALT', result: '22', unit: 'u/l', range: 'upto 42 u/l', status: 'NORMAL' },
                    { panel: 'Trop I Hs', test: 'Trop I Hs', result: '0.02', unit: 'ng/ml', range: '0.02 - 0.06 ng/ml', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Urea', result: '42', unit: 'mg/dl', range: '18 - 42 mg/dl', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Serum Creatinine', result: '1.6', unit: 'mg/dl', range: 'Male = 0.7 - 1.2 mg/dl\nFemale = 0.6 - 1.1 mg/dl', status: 'HIGH' },
                    { panel: 'RFTs', test: 'Serum Sodium', result: '139', unit: 'mmol/l', range: '135 - 150 mmol/l', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Serum Potassium', result: '4.6', unit: 'mmol/l', range: '3.4 - 5.0 mmol/l', status: 'NORMAL' },
                    { panel: 'Lipid Profile', test: 'Serum Chloesterol', result: '99', unit: 'mg/dl', range: 'Desireable = <200\nHigh = >240', status: 'NORMAL' },
                    { panel: 'Lipid Profile', test: 'Serum Triglycerides', result: '69', unit: 'mg/dl', range: 'Desireable = < 150\nHigh = > 200', status: 'NORMAL' },
                    { panel: 'Diabetec Profile', test: 'HBA1C', result: '6.1', unit: '%', range: '4.2 - 6.5 %', status: 'NORMAL' }
                  ]).map((param, pIdx) => {
                    const panelName = param.panel || param.panelName || 'General Panel';
                    const testName = param.test || param.testName || param.parameter;
                    const val = param.result;
                    const unit = param.unit || '';
                    const range = param.range || param.reference_range || (typeof param.referenceRange === 'object' ? param.referenceRange?.raw : param.referenceRange);
                    const status = param.status || 'NORMAL';

                    return (
                      <div key={pIdx} className="p-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">{panelName}</span>
                          <span className="font-bold text-slate-800">{testName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">{val} {unit}</span>
                            <span className="text-[10px] text-slate-400 block whitespace-pre-line">{range}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/intake"
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Another Report for {viewingPatientRecords.name}
              </Link>
              <button
                type="button"
                onClick={() => setViewingPatientRecords(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patients Table Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        {/* Filters Top Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID (e.g. 145104), email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500">Risk Filter:</span>
            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Patients</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Moderate Risk</option>
              <option value="LOW">Normal / Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Loading patient records...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No patients match your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try searching a different name, patient ID, or resetting the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 font-bold">Patient Info</th>
                  <th className="px-6 py-4 font-bold">Contact</th>
                  <th className="px-6 py-4 font-bold">Condition & Analyzed Notes</th>
                  <th className="px-6 py-4 font-bold">Saved Reports</th>
                  <th className="px-6 py-4 font-bold">Risk Level</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const pId = patient.patientId || patient.id || patient._id;
                  const pGender = patient.sex || patient.gender || 'Unknown';
                  const pEmail = patient.contactEmail || patient.email || 'N/A';
                  const pPhone = patient.contactPhone || patient.phone || 'N/A';

                  return (
                    <tr 
                      key={patient._id || pId} 
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      onClick={() => setViewingPatientRecords(patient)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                            {patient.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{patient.name}</p>
                            <p className="text-xs text-slate-500">ID: <span className="font-mono font-bold text-slate-700">{pId}</span> • {patient.age}y/o {pGender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                          <span>{pEmail}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{pPhone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800 block text-xs">{patient.primaryCondition || 'Clinical Lab Intake'}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Updated {patient.lastReportDate || 'Recently'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 text-xs">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                          {patient.reportsCount || 1} Reports Saved
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getRiskBadge(patient.riskLevel)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setViewingPatientRecords(patient)}
                            title="View Extracted Lab Parameters & Diagnostic Data"
                            className="text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 text-xs font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Records</span>
                          </button>
                          <Link 
                            to="/intake" 
                            className="text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
                            title="Upload & Verify Report for Patient"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Intake</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
