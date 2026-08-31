import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const LOCAL_STORAGE_KEY = 'medlab_persistent_patients_v2';
const EVENT_PATIENTS_UPDATED = 'medlab_patients_updated';

// Baseline fallback seed patients including Areeba Shahid with verified lab records
export const SEED_PATIENTS = [
  {
    _id: '60c72b2f9b1d8b0015b6d914',
    patientId: 'P-1004',
    name: 'Areeba Shahid',
    age: 24,
    gender: 'Female',
    sex: 'Female',
    phone: '+92 (300) 9988776',
    contactPhone: '+92 (300) 9988776',
    emergencyContact: '+92 (321) 7766554',
    emergencyPhone: '+92 (321) 7766554',
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
    ],
    pastReports: [
      { id: 'rep-areeba-01', name: 'AFIP_Combined_Military_Hospital_Report.jpg', date: '11-Aug-2020', status: 'VERIFIED', type: 'Complete Lab Panel (CBC, LFT, RFT, Urine RE)', isDeleted: false }
    ],
    deletedPastReports: []
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
    emergencyContact: '+92 (321) 555-0144',
    emergencyPhone: '+92 (321) 555-0144',
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
      { panel: 'RFTs', test: 'Serum Creatinine', result: '1.6', unit: 'mg/dl', range: 'Male = 0.7 - 1.2 mg/dl', status: 'HIGH' },
      { panel: 'RFTs', test: 'Serum Sodium', result: '139', unit: 'mmol/l', range: '135 - 150 mmol/l', status: 'NORMAL' },
      { panel: 'RFTs', test: 'Serum Potassium', result: '4.6', unit: 'mmol/l', range: '3.4 - 5.0 mmol/l', status: 'NORMAL' }
    ],
    pastReports: [
      { id: 'rep-01', name: 'Army_Cardiac_Center_Lab_Report_145104.pdf', date: '08-Jul-2026', status: 'VERIFIED', type: 'Lipid & Cardiac Panel', isDeleted: false }
    ],
    deletedPastReports: []
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
    emergencyContact: '+1 (555) 999-1111',
    emergencyPhone: '+1 (555) 999-1111',
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
    ],
    pastReports: [
      { id: 'rep-03', name: 'Complete_Blood_Count_CBC.pdf', date: '12-Aug-2026', status: 'VERIFIED', type: 'CBC Routine', isDeleted: false }
    ],
    deletedPastReports: []
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
    emergencyContact: '+1 (555) 888-2222',
    emergencyPhone: '+1 (555) 888-2222',
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
    ],
    pastReports: [],
    deletedPastReports: []
  }
];

function getStoredLocalPatients() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Local patient storage read error:', e);
  }
  return [];
}

function saveLocalPatients(patients) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
    window.dispatchEvent(new CustomEvent(EVENT_PATIENTS_UPDATED, { detail: patients }));
  } catch (e) {
    console.warn('Local patient storage write error:', e);
  }
}

function mergePatientLists(primary, secondary) {
  const map = new Map();
  
  [...(secondary || []), ...(primary || [])].forEach((p) => {
    if (!p) return;
    const key = p._id || p.patientId || p.name;
    const existing = map.get(key) || {};
    map.set(key, {
      ...existing,
      ...p,
      gender: p.gender || p.sex || existing.gender || 'Unknown',
      sex: p.sex || p.gender || existing.sex || 'Unknown',
      phone: p.phone || p.contactPhone || existing.phone || '',
      contactPhone: p.contactPhone || p.phone || existing.contactPhone || '',
      email: p.email || p.contactEmail || existing.email || '',
      contactEmail: p.contactEmail || p.email || existing.contactEmail || '',
      pastReports: p.pastReports || existing.pastReports || [],
      deletedPastReports: p.deletedPastReports || existing.deletedPastReports || [],
      extractedRecords: p.extractedRecords || existing.extractedRecords || []
    });
  });

  return Array.from(map.values());
}

/**
 * Fetch all patients from Backend DB + LocalStorage Cache
 */
export async function getAllPatients() {
  let backendPatients = [];
  try {
    const res = await axios.get(`${API_BASE}/patients`, { timeout: 4000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      backendPatients = res.data.data;
    }
  } catch (err) {
    console.warn('Backend /api/patients offline or delayed, using cache:', err.message);
  }

  const localSaved = getStoredLocalPatients();
  const merged = mergePatientLists(backendPatients, [...localSaved, ...SEED_PATIENTS]);
  
  // Update persistent cache
  saveLocalPatients(merged);
  return merged;
}

/**
 * Register and persist a new patient
 */
export async function registerNewPatient(patientData) {
  const generatedId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRecord = {
    _id: `pat-local-${Date.now()}`,
    patientId: generatedId,
    name: patientData.name?.trim() || 'New Patient',
    age: patientData.age ? Number(patientData.age) : 30,
    sex: patientData.sex || patientData.gender || 'Female',
    gender: patientData.sex || patientData.gender || 'Female',
    phone: patientData.phone || patientData.contactPhone || '',
    contactPhone: patientData.phone || patientData.contactPhone || '',
    emergencyContact: patientData.emergencyContact || patientData.emergencyPhone || '',
    emergencyPhone: patientData.emergencyContact || patientData.emergencyPhone || '',
    email: patientData.email || patientData.contactEmail || '',
    contactEmail: patientData.email || patientData.contactEmail || '',
    address: patientData.address || '',
    encounterStatus: 'REGISTERED',
    reportsCount: 0,
    riskLevel: 'LOW',
    primaryCondition: 'New Registration',
    lastReportDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    pastReports: [],
    deletedPastReports: [],
    extractedRecords: [],
    createdAt: new Date().toISOString()
  };

  // 1. Attempt backend POST
  try {
    const res = await axios.post(`${API_BASE}/patients`, {
      name: newRecord.name,
      age: newRecord.age,
      sex: newRecord.sex,
      gender: newRecord.gender,
      phone: newRecord.phone,
      contactPhone: newRecord.contactPhone,
      emergencyContact: newRecord.emergencyContact,
      emergencyPhone: newRecord.emergencyPhone,
      email: newRecord.email,
      contactEmail: newRecord.contactEmail,
      address: newRecord.address
    }, { timeout: 4000 });

    if (res.data?.success && res.data?.data) {
      const backendObj = res.data.data;
      newRecord._id = backendObj._id || newRecord._id;
      newRecord.patientId = backendObj.patientId || newRecord.patientId;
    }
  } catch (err) {
    console.warn('Backend patient save skipped, stored locally:', err.message);
  }

  // 2. Prepend to local storage and trigger global sync
  const currentList = getStoredLocalPatients();
  const updatedList = [newRecord, ...currentList.filter(p => p.patientId !== newRecord.patientId)];
  saveLocalPatients(updatedList);

  return newRecord;
}

/**
 * Update patient status, risk level, and verified records
 */
export async function updatePatientRecord(patientId, updatePayload) {
  // 1. Attempt backend PATCH
  try {
    await axios.patch(`${API_BASE}/patients/${patientId}/status`, updatePayload, { timeout: 4000 });
  } catch (err) {
    console.warn('Backend status update skipped, updating locally:', err.message);
  }

  // 2. Update local storage
  const currentList = getStoredLocalPatients();
  const updatedList = currentList.map((p) => {
    if (p._id === patientId || p.patientId === patientId) {
      return {
        ...p,
        ...updatePayload,
        encounterStatus: updatePayload.encounterStatus || p.encounterStatus,
        riskLevel: updatePayload.riskLevel || p.riskLevel,
        primaryCondition: updatePayload.primaryCondition || p.primaryCondition,
        extractedRecords: updatePayload.extractedRecords || p.extractedRecords || []
      };
    }
    return p;
  });

  saveLocalPatients(updatedList);
}

/**
 * Subscribe to patient updates from any page
 */
export function onPatientsUpdated(callback) {
  const handler = (e) => {
    if (callback) callback(e.detail);
  };
  window.addEventListener(EVENT_PATIENTS_UPDATED, handler);
  return () => window.removeEventListener(EVENT_PATIENTS_UPDATED, handler);
}
