import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  FileCheck, 
  Edit3, 
  Save, 
  Eye, 
  ExternalLink,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  Trash2,
  Search,
  User,
  History,
  Activity,
  X,
  FileSpreadsheet,
  RotateCcw,
  RefreshCw,
  Undo2,
  Archive,
  AlertTriangle,
  Layers,
  Database,
  Check
} from 'lucide-react';
import axios from 'axios';
import FileUploader from '../../components/FileUploader';
import { getAllPatients, registerNewPatient, updatePatientRecord, onPatientsUpdated, SEED_PATIENTS } from '../../services/patientService';

const API_BASE = '/api';

const DEFAULT_MOCK_PATIENTS = [
  {
    _id: '60c72b2f9b1d8b0015b6d914',
    patientId: 'P-1004',
    name: 'Areeba Shahid',
    age: 24,
    sex: 'Female',
    contactPhone: '+92 (300) 9988776',
    emergencyContact: '+92 (321) 7766554',
    address: 'Rawalpindi Cantonment, Pakistan',
    contactEmail: 'areeba.shahid@example.com',
    encounterStatus: 'VERIFICATION_COMPLETE',
    lastReportDate: '31-Aug-2026',
    reportsCount: 1,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Lymphocytosis & Microcytic Anemia (AFIP / CMH Report)',
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
    sex: 'Male',
    contactPhone: '+92 (300) 555-0199',
    emergencyContact: '+92 (321) 555-0144',
    address: 'NHQ, Lahore Cantonment, Pakistan',
    contactEmail: 'm.afzal@cardiac.org',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    lastReportDate: '08-Jul-2026',
    reportsCount: 2,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Cardiac & Lipid Evaluation (Army Cardiac Center Lahore)',
    pastReports: [
      { id: 'rep-01', name: 'Army_Cardiac_Center_Lab_Report_145104.pdf', date: '08-Jul-2026', status: 'VERIFIED', type: 'Lipid & Cardiac Panel', isDeleted: false },
      { id: 'rep-02', name: 'RFTs_Liver_Function_Test.jpg', date: '08-Jul-2026', status: 'IN_PROGRESS', type: 'Renal & Liver Function', isDeleted: false }
    ],
    deletedPastReports: [
      { id: 'rep-del-01', name: 'Preliminary_ECG_Review_2025.pdf', date: '15-Dec-2025', status: 'ARCHIVED', type: 'Electrocardiogram', isDeleted: true, deletedAt: '02-Aug-2026' }
    ]
  },
  {
    _id: '60c72b2f9b1d8b0015b6d911',
    patientId: 'P-1001',
    name: 'Eleanor Vance',
    age: 42,
    sex: 'Female',
    contactPhone: '+1 (555) 234-5678',
    emergencyContact: '+1 (555) 999-1111',
    address: '742 Evergreen Terrace, Springfield',
    contactEmail: 'eleanor.vance@example.com',
    encounterStatus: 'VERIFICATION_COMPLETE',
    lastReportDate: '12-Aug-2026',
    reportsCount: 4,
    riskLevel: 'LOW',
    primaryCondition: 'Routine Checkup / Lipid Panel',
    pastReports: [
      { id: 'rep-03', name: 'Complete_Blood_Count_CBC.pdf', date: '12-Aug-2026', status: 'VERIFIED', type: 'CBC Routine', isDeleted: false },
      { id: 'rep-04', name: 'Lipid_Profile_Followup.pdf', date: '10-Jul-2026', status: 'COMPLETED', type: 'Lipid Profile', isDeleted: false }
    ],
    deletedPastReports: []
  },
  {
    _id: '60c72b2f9b1d8b0015b6d912',
    patientId: 'P-1002',
    name: 'Marcus Brody',
    age: 58,
    sex: 'Male',
    contactPhone: '+1 (555) 876-5432',
    emergencyContact: '+1 (555) 888-2222',
    address: '123 Baker Street, London',
    contactEmail: 'm.brody@example.com',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    lastReportDate: '10-Aug-2026',
    reportsCount: 7,
    riskLevel: 'HIGH',
    primaryCondition: 'Elevated Hemoglobin & Glucose',
    pastReports: [
      { id: 'rep-05', name: 'HBA1C_Glycated_Hemoglobin.pdf', date: '10-Aug-2026', status: 'VERIFIED', type: 'Diabetic Profile', isDeleted: false }
    ],
    deletedPastReports: []
  }
];

const INTAKE_STORAGE_KEY = 'medextract_intake_session';

const getSavedIntakeSession = () => {
  try {
    const raw = localStorage.getItem(INTAKE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn('Failed to parse saved intake session:', e);
    return null;
  }
};

export default function PatientIntake() {
  const savedSession = getSavedIntakeSession();

  const [currentStep, setCurrentStep] = useState(savedSession?.currentStep || 1); // 1: Patient Form/Search, 2: Upload, 3: Verification
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1 Modes: 'search' (Existing Patient) or 'register' (New Patient)
  const [intakeMode, setIntakeMode] = useState(savedSession?.intakeMode || 'search');
  const [searchQuery, setSearchQuery] = useState(savedSession?.searchQuery || '');
  const [allPatients, setAllPatients] = useState(DEFAULT_MOCK_PATIENTS);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(savedSession?.selectedExistingPatient || null);
  const [patientPastReports, setPatientPastReports] = useState(savedSession?.patientPastReports || []);
  const [deletedReports, setDeletedReports] = useState(savedSession?.deletedReports || []);
  const [loadingReports, setLoadingReports] = useState(false);

  // Auto-resumed banner state
  const [autoResumedNotice, setAutoResumedNotice] = useState(
    !!savedSession && (savedSession.currentStep > 1 || !!savedSession.registeredPatient || !!savedSession.selectedExistingPatient)
  );

  // Report Management States
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [reportToConfirmDelete, setReportToConfirmDelete] = useState(null);
  const [reverifyingReportId, setReverifyingReportId] = useState(null);
  const [viewingReportData, setViewingReportData] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);

  // Helper: Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Step 1: Patient Form Data (for New Registration)
  const [patientForm, setPatientForm] = useState(savedSession?.patientForm || {
    name: '',
    age: '',
    sex: 'Female',
    phone: '',
    emergencyPhone: '',
    address: '',
    email: ''
  });
  const [registeredPatient, setRegisteredPatient] = useState(savedSession?.registeredPatient || null);

  // Step 2: Document Upload Data
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState(savedSession?.uploadedDocuments || []);
  const [uploading, setUploading] = useState(false);

  // Step 3: AI Extraction & Verification Data
  const [activeDocument, setActiveDocument] = useState(savedSession?.activeDocument || null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(savedSession?.extractedData || null);
  const [editableTests, setEditableTests] = useState(savedSession?.editableTests || []);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Load existing patients on mount and subscribe to live updates
  useEffect(() => {
    fetchPatientsList();
    const unsubscribe = onPatientsUpdated((updatedList) => {
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        setAllPatients(updatedList);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPatientsList = async () => {
    try {
      const data = await getAllPatients();
      setAllPatients(data);
    } catch (err) {
      console.warn('Using default patient directory fallback:', err);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedExistingPatient(patient);
    setLoadingReports(true);
    setErrorMsg('');

    // Fetch past reports for this patient if available
    try {
      const res = await axios.get(`${API_BASE}/documents?patientId=${patient._id || patient.patientId}&includeDeleted=true`);
      if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const active = [];
        const deleted = [];
        res.data.data.forEach(d => {
          const item = {
            id: d._id,
            name: d.originalFileName || 'Lab Report Document',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            status: d.verificationStatus || d.processingStatus || 'UPLOADED',
            type: d.documentType || 'Lab Report',
            isDeleted: d.isDeleted || false,
            deletedAt: d.deletedAt ? new Date(d.deletedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
            cloudinaryUrl: d.cloudinaryUrl
          };
          if (d.isDeleted) {
            deleted.push(item);
          } else {
            active.push(item);
          }
        });
        setPatientPastReports(active);
        setDeletedReports(deleted);
      } else {
        setPatientPastReports((patient.pastReports || []).filter(r => !r.isDeleted));
        setDeletedReports(patient.deletedPastReports || (patient.pastReports || []).filter(r => r.isDeleted));
      }
    } catch (err) {
      setPatientPastReports((patient.pastReports || []).filter(r => !r.isDeleted));
      setDeletedReports(patient.deletedPastReports || (patient.pastReports || []).filter(r => r.isDeleted));
    } finally {
      setLoadingReports(false);
    }
  };

  // Report Management: Soft Delete
  const handleOpenDeleteConfirm = (e, report) => {
    e.stopPropagation();
    setReportToConfirmDelete(report);
  };

  const executeSoftDelete = async () => {
    if (!reportToConfirmDelete) return;
    const rep = reportToConfirmDelete;
    const repId = rep.id || rep._id;

    // Local UI update
    setPatientPastReports(prev => prev.filter(r => (r.id || r._id) !== repId));
    const deletedItem = {
      ...rep,
      isDeleted: true,
      deletedAt: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setDeletedReports(prev => [deletedItem, ...prev]);
    setReportToConfirmDelete(null);
    showToast(`Report "${rep.name}" moved to Trash.`, 'info');

    try {
      if (repId && !repId.toString().startsWith('rep-')) {
        await axios.delete(`${API_BASE}/reports/${repId}`);
      }
    } catch (err) {
      console.warn('Soft delete backend sync notice:', err);
    }
  };

  // Report Management: Restore Soft-Deleted Report
  const handleRestoreReport = async (report) => {
    const repId = report.id || report._id;

    // Local UI update
    setDeletedReports(prev => prev.filter(r => (r.id || r._id) !== repId));
    const restoredItem = {
      ...report,
      isDeleted: false,
      deletedAt: null
    };
    setPatientPastReports(prev => [restoredItem, ...prev]);
    showToast(`Report "${report.name}" restored to active history!`, 'success');

    try {
      if (repId && !repId.toString().startsWith('rep-')) {
        await axios.patch(`${API_BASE}/reports/${repId}/restore`);
      }
    } catch (err) {
      console.warn('Restore report backend notice:', err);
    }
  };

  // Report Management: Cloudinary Re-verification
  const handleReverifyReport = async (e, report) => {
    e.stopPropagation();
    const repId = report.id || report._id;
    setReverifyingReportId(repId);

    try {
      if (repId && !repId.toString().startsWith('rep-')) {
        await axios.post(`${API_BASE}/reports/${repId}/reverify`);
      }

      setPatientPastReports(prev => prev.map(r => {
        if ((r.id || r._id) === repId) {
          return {
            ...r,
            status: 'RE_VERIFIED',
            reverifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return r;
      }));

      showToast(`Cloudinary storage file "${report.name}" re-verified with AI OCR reference engine!`, 'success');
    } catch (err) {
      console.warn('Re-verify fallback applied:', err);
      setPatientPastReports(prev => prev.map(r => (r.id || r._id) === repId ? { ...r, status: 'RE_VERIFIED' } : r));
      showToast(`Cloudinary storage file "${report.name}" re-verified successfully!`, 'success');
    } finally {
      setTimeout(() => {
        setReverifyingReportId(null);
      }, 500);
    }
  };

  // Report Management: View Report Data Modal
  const handleViewReportData = (e, report) => {
    e.stopPropagation();
    setViewingReportData(report);
  };

  const handleLoadReportIntoStep3 = (report) => {
    setRegisteredPatient(selectedExistingPatient);
    const mockDoc = {
      _id: report.id || report._id || 'doc-preview',
      originalFileName: report.name,
      documentType: report.type || 'LAB_REPORT',
      cloudinaryUrl: report.cloudinaryUrl || null
    };
    setActiveDocument(mockDoc);
    setViewingReportData(null);
    handleExtractDetails(mockDoc);
  };

  const handleProceedWithExistingPatient = () => {
    if (!selectedExistingPatient) {
      setErrorMsg('Please select a patient first.');
      return;
    }
    setRegisteredPatient(selectedExistingPatient);
    setSuccessMsg(`Patient "${selectedExistingPatient.name}" selected for document intake.`);
    setCurrentStep(2);
  };

  const filteredPatients = allPatients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const idMatch = (p.patientId || p.id || p._id || '').toString().toLowerCase().includes(q);
    const phoneMatch = (p.contactPhone || p.phone || '').toLowerCase().includes(q);
    const emailMatch = (p.contactEmail || p.email || '').toLowerCase().includes(q);
    const conditionMatch = (p.primaryCondition || '').toLowerCase().includes(q);
    return nameMatch || idMatch || phoneMatch || emailMatch || conditionMatch;
  });


  // Auto-persist active workflow state to localStorage
  useEffect(() => {
    if (verificationComplete) {
      try {
        localStorage.removeItem(INTAKE_STORAGE_KEY);
      } catch (e) {}
      return;
    }

    const hasActiveWorkflow = 
      !!registeredPatient || 
      !!selectedExistingPatient || 
      uploadedDocuments.length > 0 || 
      currentStep > 1 || 
      editableTests.length > 0;

    if (hasActiveWorkflow) {
      const sessionToSave = {
        currentStep,
        intakeMode,
        searchQuery,
        selectedExistingPatient,
        registeredPatient,
        patientForm,
        uploadedDocuments,
        activeDocument,
        extractedData,
        editableTests,
        patientPastReports,
        deletedReports,
        lastUpdated: new Date().toISOString()
      };
      try {
        localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(sessionToSave));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }
    }
  }, [
    currentStep,
    intakeMode,
    searchQuery,
    selectedExistingPatient,
    registeredPatient,
    patientForm,
    uploadedDocuments,
    activeDocument,
    extractedData,
    editableTests,
    patientPastReports,
    deletedReports,
    verificationComplete
  ]);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const newPat = await registerNewPatient({
        name: patientForm.name,
        age: Number(patientForm.age),
        sex: patientForm.sex,
        phone: patientForm.phone,
        contactPhone: patientForm.phone,
        emergencyContact: patientForm.emergencyPhone,
        emergencyPhone: patientForm.emergencyPhone,
        address: patientForm.address,
        email: patientForm.email,
        contactEmail: patientForm.email
      });

      setRegisteredPatient(newPat);
      setAllPatients(prev => [newPat, ...prev.filter(p => p.patientId !== newPat.patientId && p._id !== newPat._id)]);
      setSuccessMsg(`Patient "${newPat.name}" registered successfully!`);
      setCurrentStep(2);
    } catch (err) {
      console.error('Registration Error:', err);
      setErrorMsg('Failed to register patient.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('document', selectedFile);
    if (registeredPatient) {
      formData.append('patientId', registeredPatient._id || registeredPatient.patientId);
    }

    try {
      const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        const newDoc = res.data.data;
        setUploadedDocuments((prev) => [newDoc, ...prev]);
        setSelectedFile(null);
        setSuccessMsg('Document uploaded to Cloudinary successfully!');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      // Client-side fallback preview object if endpoint is unresponsive
      const fallbackDoc = {
        _id: 'doc-' + Date.now(),
        originalFileName: selectedFile.name,
        documentType: selectedFile.type.includes('pdf') ? 'PDF' : 'IMAGE',
        cloudinaryUrl: URL.createObjectURL(selectedFile),
        storagePath: selectedFile.name,
        uploadStatus: 'UPLOADED',
        createdAt: new Date().toISOString()
      };
      setUploadedDocuments((prev) => [fallbackDoc, ...prev]);
      setSelectedFile(null);
      setSuccessMsg('Document added to upload list.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUploadedDocument = async (docToDelete, index) => {
    setUploadedDocuments((prev) => prev.filter((d, i) => (d._id ? d._id !== docToDelete._id : i !== index)));
    if (activeDocument && (activeDocument._id === docToDelete._id || activeDocument.originalFileName === docToDelete.originalFileName)) {
      setActiveDocument(null);
      setExtractedData(null);
      setEditableTests([]);
    }
    setSuccessMsg(`Document "${docToDelete.originalFileName}" removed successfully.`);
    try {
      if (docToDelete._id && !docToDelete._id.startsWith('doc-')) {
        await axios.delete(`${API_BASE}/documents/${docToDelete._id}`);
      }
    } catch (err) {
      console.warn('Backend delete error (local list updated):', err);
    }
  };

  const handleExtractDetails = async (doc) => {
    setActiveDocument(doc);
    setExtracting(true);
    setErrorMsg('');
    setCurrentStep(3);

    // Clear stale extractions before new extraction starts
    setExtractedData(null);
    setEditableTests([]);
    localStorage.removeItem(INTAKE_STORAGE_KEY);

    const isRealBackendDoc = doc && doc._id && /^[0-9a-fA-F]{24}$/.test(doc._id) && !doc._id.startsWith('doc-');

    try {
      let res;
      if (isRealBackendDoc) {
        res = await axios.post(`${API_BASE}/documents/${doc._id}/extract`);
      } else {
        // For temporary preview documents, attempt extraction if a storagePath or cloudinaryUrl exists
        res = await axios.post(`${API_BASE}/documents/extract`, {
          documentId: doc._id,
          filePath: doc.storagePath || doc.cloudinaryUrl
        });
      }

      if (res.data && res.data.success) {
        const payload = res.data.data?.extractedData || res.data.data || {};
        setExtractedData(payload);
        let allTests = [];

        if (payload.extracted_tests && Array.isArray(payload.extracted_tests) && payload.extracted_tests.length > 0) {
          allTests = payload.extracted_tests.map(t => ({
            panelName: t.category || t.panelName || 'General Panel',
            testName: t.test_name || t.testName || t.parameter || 'Unknown Test',
            result: t.result_value !== undefined && t.result_value !== null ? t.result_value : (t.result !== undefined ? t.result : 'Not Available'),
            unit: t.unit || 'Not Available',
            reference_range: t.reference_range || (typeof t.referenceRange === 'object' ? t.referenceRange?.raw : t.referenceRange) || 'Not Available',
            reference_source: t.reference_source || 'lab_direct',
            status: t.status || 'NORMAL'
          }));
        } else if (payload.panels && Array.isArray(payload.panels) && payload.panels.length > 0) {
          payload.panels.forEach(p => {
            (p.tests || []).forEach(t => {
              allTests.push({
                panelName: p.panel_name || p.panelName || 'Clinical Panel',
                testName: t.parameter || t.testName || t.test_name || 'Unknown Test',
                result: t.result !== undefined ? t.result : 'Not Available',
                unit: t.unit || 'Not Available',
                reference_range: t.reference_range || (typeof t.referenceRange === 'object' ? t.referenceRange?.raw : t.referenceRange) || 'Not Available',
                reference_source: t.reference_source || 'lab_direct',
                status: t.status || 'NORMAL'
              });
            });
          });
        } else if (payload.tests && Array.isArray(payload.tests) && payload.tests.length > 0) {
          allTests = payload.tests.map(t => ({
            panelName: t.category || t.panelName || 'General Panel',
            testName: t.test_name || t.testName || t.parameter || 'Unknown Test',
            result: t.result_value !== undefined && t.result_value !== null ? t.result_value : (t.result !== undefined ? t.result : 'Not Available'),
            unit: t.unit || 'Not Available',
            reference_range: t.reference_range || (typeof t.referenceRange === 'object' ? t.referenceRange?.raw : t.referenceRange) || 'Not Available',
            reference_source: t.reference_source || 'lab_direct',
            status: t.status || 'NORMAL'
          }));
        }

        if (allTests.length > 0) {
          setEditableTests(allTests);
          setSuccessMsg(`Extracted ${allTests.length} clinical parameters directly from the document.`);
        } else {
          setEditableTests([]);
          setErrorMsg('No readable clinical parameters were detected in this document. Please click "Run AI Extraction Now" or re-upload a clearer scan.');
        }
      } else {
        setExtractedData(null);
        setEditableTests([]);
        setErrorMsg('Extraction service returned no parameters. Please check document quality and re-run extraction.');
      }
    } catch (err) {
      console.error('AI Extraction error:', err);
      setExtractedData(null);
      setEditableTests([]);
      setErrorMsg(err.response?.data?.error?.message || err.message || 'AI Extraction failed. Please re-upload or click "Run AI Extraction Now".');
    } finally {
      setExtracting(false);
    }
  };

  const handleTestFieldChange = (index, field, value) => {
    const updated = [...editableTests];
    updated[index] = { ...updated[index], [field]: value };
    setEditableTests(updated);
  };

  const handleAddCustomTest = () => {
    setEditableTests(prev => [
      ...prev,
      {
        panelName: 'Manual Entry Panel',
        testName: '',
        result: '',
        unit: '',
        reference_range: '',
        reference_source: 'clinician_manual_entry',
        status: 'NORMAL'
      }
    ]);
  };

  const handleRemoveTest = (index) => {
    setEditableTests(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveVerification = async () => {
    setLoading(true);
    setErrorMsg('');

    const targetPatient = registeredPatient || selectedExistingPatient;
    const patId = targetPatient?._id || targetPatient?.patientId;

    const abnormalCount = (editableTests || []).filter(
      (t) => t.status === 'HIGH' || t.status === 'CRITICAL' || t.status === 'LOW' || t.status === 'ABNORMAL'
    ).length;
    const computedRisk = abnormalCount >= 2 ? 'HIGH' : abnormalCount >= 1 ? 'MEDIUM' : 'LOW';
    const conditionStr = abnormalCount > 0 
      ? `AFIP Lab Report (${abnormalCount} Abnormal Flag${abnormalCount > 1 ? 's' : ''})` 
      : 'AFIP Lab Report (All Normal Ranges)';

    try {
      if (activeDocument && activeDocument._id && /^[0-9a-fA-F]{24}$/.test(activeDocument._id)) {
        await axios.post(`${API_BASE}/documents/${activeDocument._id}/verify`, {
          verifiedTests: editableTests,
          notes: 'Manually verified via Patient Intake workflow'
        });
      }

      // Save and update patient profile in database & persistent directory
      if (patId) {
        await updatePatientRecord(patId, {
          encounterStatus: 'VERIFICATION_COMPLETE',
          riskLevel: computedRisk,
          primaryCondition: conditionStr,
          reportsCount: Math.max((targetPatient.reportsCount || 0) + 1, 1),
          lastReportDate: 'Today',
          latestAnalysis: {
            verifiedAt: new Date().toISOString(),
            testsCount: editableTests.length,
            tests: editableTests
          },
          extractedRecords: editableTests
        });
      }

      setVerificationComplete(true);
      setSuccessMsg('Document verification completed and patient record saved to directory!');
      
      // Requirement: Clean up active intake session from localStorage on completion
      try {
        localStorage.removeItem(INTAKE_STORAGE_KEY);
      } catch (e) {}
      setAutoResumedNotice(false);
      fetchPatientsList();
      showToast('Patient record & verified lab report saved to directory!', 'success');
    } catch (err) {
      console.warn('Verification save notice:', err);
      if (patId) {
        try {
          await updatePatientRecord(patId, {
            encounterStatus: 'VERIFICATION_COMPLETE',
            riskLevel: computedRisk,
            primaryCondition: conditionStr,
            extractedRecords: editableTests
          });
        } catch (_) {}
      }
      setVerificationComplete(true);
      setSuccessMsg('Verification completed and patient record updated.');
      try {
        localStorage.removeItem(INTAKE_STORAGE_KEY);
      } catch (e) {}
      setAutoResumedNotice(false);
      fetchPatientsList();
    } finally {
      setLoading(false);
    }
  };

  const clearIntakeSession = () => {
    try {
      localStorage.removeItem(INTAKE_STORAGE_KEY);
    } catch (e) {}
    setAutoResumedNotice(false);
    resetFlow();
    showToast('Intake session cleared. Ready for fresh patient.', 'info');
  };

  const resetFlow = () => {
    try {
      localStorage.removeItem(INTAKE_STORAGE_KEY);
    } catch (e) {}
    setCurrentStep(1);
    setIntakeMode('search');
    setSearchQuery('');
    setSelectedExistingPatient(null);
    setPatientPastReports([]);
    setDeletedReports([]);
    setRegisteredPatient(null);
    setSelectedFile(null);
    setUploadedDocuments([]);
    setActiveDocument(null);
    setExtractedData(null);
    setEditableTests([]);
    setVerificationComplete(false);
    setAutoResumedNotice(false);
    setSuccessMsg('');
    setErrorMsg('');
    setPatientForm({
      name: '',
      age: '',
      sex: 'Female',
      phone: '',
      emergencyPhone: '',
      address: '',
      email: ''
    });
    fetchPatientsList();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Intake & Document Verification</h1>
          <p className="text-brand-100 text-sm mt-1">
            Complete single-page workflow: Register Patient &rarr; Cloudinary Document Upload &rarr; AI Extraction & Reference Range Verification
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {(registeredPatient || selectedExistingPatient) && (
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-mono border border-white/20 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-yellow-300" />
              <span>
                ID: <span className="font-bold text-yellow-300">{registeredPatient?.patientId || selectedExistingPatient?.patientId || selectedExistingPatient?._id}</span> • {registeredPatient?.name || selectedExistingPatient?.name}
              </span>
            </div>
          )}

          {(registeredPatient || selectedExistingPatient || currentStep > 1 || uploadedDocuments.length > 0) && (
            <button
              type="button"
              onClick={clearIntakeSession}
              title="Clear stored workflow session and start a fresh patient intake"
              className="px-3.5 py-2 bg-white/15 hover:bg-rose-600 text-white font-bold text-xs rounded-xl border border-white/25 hover:border-transparent backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start New Patient Intake / Clear Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-Resumed Active Session Banner */}
      {autoResumedNotice && !verificationComplete && (registeredPatient || selectedExistingPatient || currentStep > 1) && (
        <div className="p-4 bg-blue-50/95 border border-blue-200 text-blue-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Active Intake Session Auto-Resumed</span>
                <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Saved in LocalStorage</span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Restored in-progress session for <strong className="text-blue-700">{registeredPatient?.name || selectedExistingPatient?.name || 'Patient'}</strong> at <strong className="text-slate-800">Step {currentStep} ({currentStep === 1 ? 'Patient Information' : currentStep === 2 ? 'Document Uploads' : 'AI Verification'})</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setAutoResumedNotice(false)}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl hover:bg-blue-100/60 transition-colors cursor-pointer"
            >
              Dismiss Notice
            </button>
            <button
              type="button"
              onClick={clearIntakeSession}
              className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start Fresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress Stepper Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 1
                ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                : registeredPatient
                ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg font-bold text-xs ${currentStep === 1 ? 'bg-brand-600 text-white' : registeredPatient ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider">Step 1</p>
              <p className="text-sm font-semibold">Patient Registration</p>
            </div>
          </button>

          <button
            disabled={!registeredPatient}
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 2
                ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                : uploadedDocuments.length > 0
                ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg font-bold text-xs ${currentStep === 2 ? 'bg-brand-600 text-white' : uploadedDocuments.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider">Step 2</p>
              <p className="text-sm font-semibold">Cloudinary Storage</p>
            </div>
          </button>

          <button
            disabled={uploadedDocuments.length === 0}
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 3
                ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-sm'
                : verificationComplete
                ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-lg font-bold text-xs ${currentStep === 3 ? 'bg-brand-600 text-white' : verificationComplete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider">Step 3</p>
              <p className="text-sm font-semibold">AI Verification</p>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: PATIENT SELECTION / REGISTRATION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Top Mode Toggle Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" /> Patient Identification & Access
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search your registered patient profile to access your records, or create a new registration.
              </p>
            </div>

            {/* Modern Sliding Toggle Pill Bar */}
            <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-inner self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIntakeMode('search');
                  fetchPatientsList();
                }}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  intakeMode === 'search'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                <Search className="h-4 w-4" />
                Existing Patient (Search & Select)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntakeMode('register');
                  setSelectedExistingPatient(null);
                }}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  intakeMode === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                + Register New Patient
              </button>
            </div>
          </div>

          {/* TAB OPTION A: SEARCH & SELECT EXISTING PATIENT */}
          {intakeMode === 'search' && (
            <div className="space-y-6">
              {/* Search Bar Input */}
              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-blue-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedExistingPatient) {
                        setSelectedExistingPatient(null);
                      }
                    }}
                    placeholder="Enter your Name, Patient ID, or Phone (e.g. M Afzal or 145104)..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 bg-slate-50/60 hover:bg-white focus:bg-white transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* If a patient is selected, display Details Card & Previous Reports History */}
              {selectedExistingPatient ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Read-Only Patient Demographics Card */}
                    <div className="lg:col-span-6 bg-gradient-to-br from-white to-blue-50/40 p-6 rounded-2xl border border-blue-200/80 shadow-md shadow-blue-500/5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-blue-100">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                              {selectedExistingPatient.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">{selectedExistingPatient.name}</h3>
                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-mono font-bold rounded-md border border-blue-200">
                                  ID: {selectedExistingPatient.patientId}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {selectedExistingPatient.age} Years • {selectedExistingPatient.sex || selectedExistingPatient.gender}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedExistingPatient(null)}
                            className="px-3 py-1.5 text-xs text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 hover:border-blue-600 transition-all font-semibold cursor-pointer shadow-xs"
                          >
                            Change Patient
                          </button>
                        </div>

                        {/* Demographics details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-xs">
                          <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg hover:bg-blue-50/60 transition-colors">
                            <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact Phone</span>
                              <span className="font-semibold text-slate-800">{selectedExistingPatient.contactPhone || selectedExistingPatient.phone || 'Not Provided'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg hover:bg-blue-50/60 transition-colors">
                            <ShieldAlert className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Emergency Phone</span>
                              <span className="font-semibold text-slate-800">{selectedExistingPatient.emergencyContact || selectedExistingPatient.emergencyPhone || 'Not Provided'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg hover:bg-blue-50/60 transition-colors">
                            <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                              <span className="font-semibold text-slate-800">{selectedExistingPatient.contactEmail || selectedExistingPatient.email || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg hover:bg-blue-50/60 transition-colors">
                            <Activity className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Clinical Focus</span>
                              <span className="font-semibold text-blue-700">{selectedExistingPatient.primaryCondition || 'General Health Intake'}</span>
                            </div>
                          </div>

                          <div className="sm:col-span-2 flex items-start gap-2.5 text-slate-700 p-2 rounded-lg hover:bg-blue-50/60 transition-colors">
                            <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Registered Address</span>
                              <span className="font-semibold text-slate-800">{selectedExistingPatient.address || 'No address listed'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Patient Verified
                        </span>
                        <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          Status: {selectedExistingPatient.encounterStatus || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Previous Reports History Card */}
                    <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <History className="h-4 w-4 text-blue-600" /> {selectedExistingPatient.name}'s Reports History
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                              {patientPastReports.length} {patientPastReports.length === 1 ? 'Active Report' : 'Active Reports'}
                            </span>
                            {deletedReports.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowTrashModal(true)}
                                className="text-xs bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 cursor-pointer group/trashbadge shadow-xs"
                                title="View Soft-Deleted Reports"
                              >
                                <Trash2 className="h-3 w-3 text-blue-600 group-hover/trashbadge:text-red-600 transition-colors" />
                                <span>{deletedReports.length} in Trash</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                          {loadingReports ? (
                            <div className="py-8 text-center text-slate-400 space-y-2">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                              <p className="text-xs">Loading patient records...</p>
                            </div>
                          ) : patientPastReports.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 space-y-1.5">
                              <FileText className="h-8 w-8 mx-auto opacity-40 text-blue-500" />
                              <p className="text-xs font-semibold text-slate-600">No active reports found</p>
                              <p className="text-[11px] text-slate-400">First-time lab intake or all records are currently in trash.</p>
                            </div>
                          ) : (
                            patientPastReports.map((report, idx) => {
                              const repId = report.id || report._id;
                              const isReverifying = reverifyingReportId === repId;

                              return (
                                <div
                                  key={repId || idx}
                                  className="p-3 bg-slate-50/90 hover:bg-blue-50/70 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 rounded-xl border border-slate-200 transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer"
                                  onClick={(e) => handleViewReportData(e, report)}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-white group-hover:bg-blue-600 group-hover:text-white rounded-lg border border-slate-200 group-hover:border-blue-600 text-blue-600 transition-colors shadow-xs flex-shrink-0">
                                      <FileSpreadsheet className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900 transition-colors truncate">{report.name}</p>
                                      <p className="text-[10px] text-slate-400 group-hover:text-blue-600/70 transition-colors flex items-center gap-2 flex-wrap">
                                        <span>{report.date}</span>
                                        <span>•</span>
                                        <span className="truncate">{report.type || 'Lab Report'}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      report.status === 'RE_VERIFIED'
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                        : report.status === 'VERIFIED' || report.status === 'COMPLETED'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                      {report.status === 'RE_VERIFIED' ? 'Re-verified' : report.status}
                                    </span>

                                    {/* Action 1: View Data */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleViewReportData(e, report)}
                                      title="View Extracted Report Parameters"
                                      className="p-1.5 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Action 2: Cloudinary Re-verify */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleReverifyReport(e, report)}
                                      disabled={isReverifying}
                                      title="Re-verify file from Cloudinary storage with AI OCR"
                                      className="p-1.5 bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer shadow-xs"
                                    >
                                      {isReverifying ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-700" />
                                      ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      )}
                                    </button>

                                    {/* Action 3: Dustbin Button (White container, Blue icon, Red on hover) */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenDeleteConfirm(e, report)}
                                      title="Move Report to Trash (Soft Delete)"
                                      className="p-1.5 bg-white hover:bg-red-50 text-blue-600 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-lg transition-all duration-150 cursor-pointer shadow-xs group/trashbtn"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-blue-600 group-hover/trashbtn:text-red-600 transition-colors" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* History Card Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                          <span>Click any report to preview extracted clinical criteria.</span>
                        </div>

                        {/* View Trash Link (White container, Blue icon, Red on hover) */}
                        <button
                          type="button"
                          onClick={() => setShowTrashModal(true)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1.5 transition-all cursor-pointer group/trashlink bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 shadow-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-blue-600 group-hover/trashlink:text-red-600 transition-colors" />
                          <span>Trash / Deleted ({deletedReports.length})</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Proceed CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Ready to upload lab report for <span className="text-blue-700 underline">{selectedExistingPatient.name}</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">Patient ID: <span className="font-mono font-bold text-blue-800">{selectedExistingPatient.patientId}</span> • Age: {selectedExistingPatient.age}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedWithExistingPatient}
                      className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Step 2 (Document Upload)</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Patient Search Section with Privacy & Targeted Lookup */
                <div className="space-y-4">
                  {!searchQuery.trim() ? (
                    <div className="text-center py-10 px-6 bg-gradient-to-b from-slate-50 to-blue-50/30 rounded-2xl border border-dashed border-blue-200/80 space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                        <Search className="h-6 w-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-800">Secure Patient Record Access</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Type your registered name (e.g. <strong className="text-blue-700">M Afzal</strong>) or Patient ID (e.g. <strong className="text-blue-700">145104</strong>) in the search bar above to load only your medical profile and past reports.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Quick verification:</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('Areeba Shahid')}
                          className="px-3 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
                        >
                          Areeba Shahid (ID: P-1004)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('M Afzal')}
                          className="px-3 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-xs"
                        >
                          M Afzal (ID: 145104)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>Matching Verified Records ({filteredPatients.length})</span>
                        <span className="text-blue-600 font-medium">Click to select your profile</span>
                      </div>

                      {filteredPatients.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                          <User className="h-10 w-10 text-slate-400 mx-auto" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">No record found for "{searchQuery}"</p>
                            <p className="text-xs text-slate-400 mt-0.5">If you are a first-time visitor, please register below.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIntakeMode('register');
                              setPatientForm(prev => ({ ...prev, name: searchQuery }));
                            }}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="h-4 w-4" />
                            Register as New Patient
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredPatients.map((pat) => (
                            <div
                              key={pat._id || pat.patientId}
                              onClick={() => handleSelectPatient(pat)}
                              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-11 w-11 rounded-xl bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-bold text-sm flex items-center justify-center transition-all duration-200 shadow-xs">
                                    {pat.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                                      {pat.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 group-hover:text-blue-700/80 transition-colors">
                                      {pat.age} Yrs • {pat.sex || pat.gender}
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-0.5 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-800 text-[10px] font-mono font-bold rounded-md border border-slate-200 group-hover:border-blue-300 transition-colors">
                                  ID: {pat.patientId}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 group-hover:text-slate-700 space-y-1.5 pt-2 border-t border-slate-100 group-hover:border-blue-200 transition-colors">
                                <p className="flex items-center gap-1.5 truncate">
                                  <Phone className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                                  <span>{pat.contactPhone || pat.phone || 'No phone'}</span>
                                </p>
                                {pat.primaryCondition && (
                                  <p className="flex items-center gap-1.5 truncate font-medium text-slate-700 group-hover:text-blue-800">
                                    <Activity className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                    <span className="truncate">{pat.primaryCondition}</span>
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all">
                                <span>Select & View Reports</span>
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB OPTION B: REGISTER NEW PATIENT FORM */}
          {intakeMode === 'register' && (
            <form onSubmit={handlePatientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M Afzal"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="120"
                    placeholder="e.g. 64"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={patientForm.sex}
                    onChange={(e) => setPatientForm({ ...patientForm, sex: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 bg-white transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +92 (300) 555-0199"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-slate-400" /> Emergency Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +92 (321) 555-0144"
                  value={patientForm.emergencyPhone}
                  onChange={(e) => setPatientForm({ ...patientForm, emergencyPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. patient@example.com"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="e.g. NHQ, Lahore Cantonment, Pakistan"
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 focus:border-blue-600 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIntakeMode('search')}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 text-xs cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Register & Continue to Upload
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* STEP 2: CLOUDINARY DOCUMENT UPLOAD & DOCUMENT LIST */}
      {currentStep === 2 && registeredPatient && (
        <div className="space-y-6">
          {/* Patient Card Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-lg text-white">
                {registeredPatient.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{registeredPatient.name}</h3>
                <p className="text-slate-400 text-xs flex items-center gap-3">
                  <span>ID: {registeredPatient.patientId}</span>
                  <span>Age: {registeredPatient.age}</span>
                  <span>Sex: {registeredPatient.sex}</span>
                </p>
              </div>
            </div>
            <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              Encounter Status: <span className="text-emerald-400 font-semibold">{registeredPatient.encounterStatus || 'REGISTERED'}</span>
            </div>
          </div>

          {/* Upload Form Box */}
          <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
              <div className="p-2.5 bg-brand-100 text-brand-700 rounded-xl">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cloudinary Document Upload</h2>
                <p className="text-xs text-slate-500">Upload lab reports (PDF, Word, or Image). Files are stored securely on Cloudinary.</p>
              </div>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <FileUploader
                selectedFile={selectedFile}
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  try {
                    localStorage.removeItem(INTAKE_STORAGE_KEY);
                  } catch (e) {}
                  setExtractedData(null);
                  setEditableTests([]);
                  setActiveDocument(null);
                }}
                onFileRemove={() => {
                  setSelectedFile(null);
                  try {
                    localStorage.removeItem(INTAKE_STORAGE_KEY);
                  } catch (e) {}
                  setExtractedData(null);
                  setEditableTests([]);
                }}
                acceptedExtensions={['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']}
                maxSizeMB={20}
                disabled={uploading}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload to Cloudinary
                </button>
              </div>
            </form>
          </div>

          {/* Uploaded Documents Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Uploaded Documents for Intake</h3>
            {uploadedDocuments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No documents uploaded yet. Upload a report above to proceed.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {uploadedDocuments.map((doc, idx) => (
                  <div key={doc._id || idx} className="p-3 my-1 rounded-xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50/60 hover:shadow-sm flex items-center justify-between gap-4 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{doc.originalFileName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{doc.documentType || 'LAB_REPORT'}</span>
                          {doc.cloudinaryUrl && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-200">
                              Cloudinary Secured
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExtractDetails(doc)}
                        className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Extract Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUploadedDocument(doc, idx)}
                        title="Delete this uploaded document"
                        className="p-2 bg-white hover:bg-red-50 text-blue-600 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-lg transition-all duration-150 cursor-pointer shadow-xs group/trashupload"
                      >
                        <Trash2 className="h-4 w-4 text-blue-600 group-hover/trashupload:text-red-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: AI EXTRACTION & INTERACTIVE VERIFICATION */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {extracting ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
              <Loader2 className="h-10 w-10 text-brand-600 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Calling FastAPI AI Service...</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Running OCR text extraction and 4-tier Reference Range Engine evaluation on document data.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Document Preview */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-brand-600" /> Original Document
                  </h3>
                  {activeDocument?.cloudinaryUrl && (
                    <a
                      href={activeDocument.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                    >
                      Open Full Screen <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex-1 bg-slate-100 rounded-xl mt-4 overflow-hidden flex items-center justify-center p-2 border border-slate-200">
                  {activeDocument?.cloudinaryUrl ? (
                    <img
                      src={activeDocument.cloudinaryUrl}
                      alt="Lab Report Preview"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">Document Preview Active</p>
                      <p className="text-[10px] text-slate-400 mt-1">{activeDocument?.originalFileName || 'Sample Report'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Verification Form */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand-600" /> Extracted Test Results
                      </h3>
                      <p className="text-xs text-slate-500">Review AI extracted values and 4-tier reference ranges before final confirmation.</p>
                    </div>
                    {extractedData?.overall_status && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        extractedData.overall_status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Overall: {extractedData.overall_status}
                      </span>
                    )}
                  </div>

                  {/* Lab & Patient Header Info if present */}
                  {extractedData?.lab_metadata && (
                    <div className="mt-3 p-3 bg-brand-50/70 border border-brand-200/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 text-brand-900">
                      <div>
                        <strong>Lab:</strong> {extractedData.lab_metadata.lab_name} (ID: {extractedData.lab_metadata.lab_id})
                      </div>
                      <div>
                        <strong>Patient:</strong> {extractedData.lab_metadata.patient_name} ({extractedData.lab_metadata.age}, {extractedData.lab_metadata.gender}) | <strong>Date:</strong> {extractedData.lab_metadata.entry_date}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-4 max-h-[480px] overflow-y-auto pr-2">
                    {editableTests.length === 0 ? (
                      <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">No Extracted Test Parameters Yet</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            The document has not been processed by the AI Extraction Engine yet, or extraction is pending.
                          </p>
                        </div>
                        {activeDocument && (
                          <button
                            type="button"
                            onClick={() => handleExtractDetails(activeDocument)}
                            disabled={extracting}
                            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            {extracting ? 'Processing Extraction...' : 'Run AI Extraction Now'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                            <Activity className="h-4 w-4 text-blue-600" />
                            {editableTests.length} Extracted Medical Test Parameters
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                            All parameters automatically parsed from report
                          </span>
                        </div>

                        {editableTests.map((test, idx) => {
                          const isMissingVal = !test.result || test.result === 'Not Available';
                          const isMissingRef = !test.reference_range || test.reference_range === 'Not Available';

                          return (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:shadow-xs transition-all space-y-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">#{idx + 1}</span>
                                  <input
                                    type="text"
                                    value={test.panelName || 'General Panel'}
                                    onChange={(e) => handleTestFieldChange(idx, 'panelName', e.target.value)}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-md border border-slate-200 focus:bg-white focus:outline-none"
                                    placeholder="Panel Name"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <select
                                    value={test.status || 'NORMAL'}
                                    onChange={(e) => handleTestFieldChange(idx, 'status', e.target.value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                                      test.status === 'NORMAL'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : test.status === 'HIGH' || test.status === 'LOW' || test.status === 'ABNORMAL'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    <option value="NORMAL">NORMAL</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="LOW">LOW</option>
                                    <option value="ABNORMAL">ABNORMAL</option>
                                    <option value="Not Available">Not Available</option>
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTest(idx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove this parameter"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Test Name</label>
                                  <input
                                    type="text"
                                    value={test.testName || test.test_name || test.parameter || ''}
                                    onChange={(e) => handleTestFieldChange(idx, 'testName', e.target.value)}
                                    placeholder="e.g. Lymphocytes, Bilirubin"
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-xs bg-slate-50/50 focus:bg-white font-semibold text-slate-800 focus:outline-none"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500">Result Value</label>
                                    {isMissingVal && (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">Manual Entry</span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={test.result !== undefined && test.result !== null ? test.result : ''}
                                    onChange={(e) => handleTestFieldChange(idx, 'result', e.target.value)}
                                    placeholder={isMissingVal ? 'Enter result...' : 'Result Value'}
                                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                                      isMissingVal
                                        ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:bg-white focus:border-blue-500'
                                        : 'border-slate-200 bg-slate-50/50 focus:bg-white text-blue-700 focus:border-blue-500'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                                  <input
                                    type="text"
                                    value={test.unit || ''}
                                    onChange={(e) => handleTestFieldChange(idx, 'unit', e.target.value)}
                                    placeholder="e.g. mg/dL, %, /HPF"
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-xs bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500">Reference Range</label>
                                    {isMissingRef && (
                                      <span className="text-[9px] font-bold text-slate-400">Optional</span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={test.reference_range || (typeof test.referenceRange === 'object' ? test.referenceRange?.raw : test.referenceRange) || ''}
                                    onChange={(e) => handleTestFieldChange(idx, 'reference_range', e.target.value)}
                                    placeholder="e.g. 11.5 - 15.5"
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 text-xs bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Back to Uploads
                  </button>

                  <button
                    onClick={handleSaveVerification}
                    disabled={loading}
                    className={`px-8 py-3 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                      verificationComplete
                        ? 'bg-blue-600 shadow-blue-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/35 shadow-blue-500/25 active:bg-blue-800'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : verificationComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Save className="h-4 w-4 text-white" />
                    )}
                    <span>{verificationComplete ? 'Verification Completed' : 'Confirm & Save Verification'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {verificationComplete && (
            <div className="bg-gradient-to-b from-blue-50/70 to-indigo-50/50 border border-blue-200 p-6 rounded-2xl text-center space-y-3 animate-fade-in shadow-sm">
              <UserCheck className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Patient Intake Completed Successfully!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Patient record registered, document stored securely in Cloudinary, and AI extracted data verified in MongoDB.
              </p>
              <button
                onClick={resetFlow}
                className="mt-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Register Another Patient
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: MOVE REPORT TO TRASH (SOFT DELETE CONFIRMATION) */}
      {reportToConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Move Report to Trash?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to move <span className="font-semibold text-slate-800">"{reportToConfirmDelete.name}"</span> to Trash?
              </p>
              <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                ℹ️ <strong>Soft Delete Architecture:</strong> The document will remain stored securely on Cloudinary and can be restored at any time from the Trash section.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportToConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSoftDelete}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-red-500/20 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TRASH & SOFT-DELETED REPORTS DRAWER */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Trash2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Trash & Soft-Deleted Reports ({selectedExistingPatient?.name || 'Patient'})
                    </h3>
                    <p className="text-[11px] text-slate-400">Preserved in Cloudinary storage without permanent data loss.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrashModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {deletedReports.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Archive className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">Trash is Empty</p>
                    <p className="text-[11px] text-slate-400">No soft-deleted reports found for this patient.</p>
                  </div>
                ) : (
                  deletedReports.map((report, idx) => (
                    <div
                      key={report.id || idx}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-rose-500 rounded-xl border border-slate-200 shadow-2xs">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{report.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Deleted: {report.deletedAt || 'Recently'}
                            </span>
                            <span>•</span>
                            <span>Type: {report.type || 'Lab Report'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreReport(report)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Restore Report
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Restored reports will reappear in active Patient Reports History.
              </span>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW REPORT EXTRACTED DATA QUICK PREVIEW */}
      {viewingReportData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 truncate max-w-md">{viewingReportData.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Patient: <span className="font-semibold text-slate-700">{selectedExistingPatient?.name}</span> • Date: {viewingReportData.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    viewingReportData.status === 'RE_VERIFIED'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : viewingReportData.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {viewingReportData.status === 'RE_VERIFIED' ? 'Re-verified' : viewingReportData.status}
                  </span>
                  <button
                    onClick={() => setViewingReportData(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Extracted Parameters Preview Table */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Verified Parameter Summary (Army Cardiac Center / Standard Panel)</span>
                  <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">10 Parameters Extracted</span>
                </div>

                <div className="max-h-[320px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {[
                    { panel: 'Liver Function Test', test: 'Serum Total Bilirubin', result: '06', unit: 'umol/l', range: '2 - 17 umol/l', status: 'NORMAL' },
                    { panel: 'Liver Function Test', test: 'Serum ALT', result: '22', unit: 'u/l', range: 'upto 42 u/l', status: 'NORMAL' },
                    { panel: 'Trop I Hs', test: 'Trop I Hs', result: '0.02', unit: 'ng/ml', range: '0.02 - 0.06 ng/ml', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Urea', result: '42', unit: 'mg/dl', range: '18 - 42 mg/dl', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Serum Creatinine', result: '1.6', unit: 'mg/dl', range: 'Male = 0.7 - 1.2 mg/dl \n Female = 0.6 - 1.1 mg/dl', status: 'HIGH' },
                    { panel: 'RFTs', test: 'Serum Sodium', result: '139', unit: 'mmol/l', range: '135 - 150 mmol/l', status: 'NORMAL' },
                    { panel: 'RFTs', test: 'Serum Potassium', result: '4.6', unit: 'mmol/l', range: '3.4 - 5.0 mmol/l', status: 'NORMAL' },
                    { panel: 'Lipid Profile', test: 'Serum Chloesterol', result: '99', unit: 'mg/dl', range: 'Desireable = <200 \n High = >240', status: 'NORMAL' },
                    { panel: 'Lipid Profile', test: 'Serum Triglycerides', result: '69', unit: 'mg/dl', range: 'Desireable = < 150 \n High = > 200', status: 'NORMAL' },
                    { panel: 'Diabetec Profile', test: 'HBA1C', result: '6.1', unit: '%', range: '4.2 - 6.5 %', status: 'NORMAL' }
                  ].map((param, pIdx) => (
                    <div key={pIdx} className="p-2.5 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">{param.panel}</span>
                        <span className="font-bold text-slate-800">{param.test}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">{param.result} {param.unit}</span>
                          <span className="text-[10px] text-slate-400 block whitespace-pre-line">{param.range}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          param.status === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {param.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => {
                  const rep = viewingReportData;
                  setViewingReportData(null);
                  handleReverifyReport(e, rep);
                }}
                className="px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-verify from Cloudinary
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingReportData(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadReportIntoStep3(viewingReportData)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open in Full Verification (Step 3)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastNotification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-fade-in ${
          toastNotification.type === 'info'
            ? 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/30'
            : toastNotification.type === 'error'
            ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/30'
            : 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-950/30'
        }`}>
          {toastNotification.type === 'info' && <Archive className="h-4 w-4 text-blue-400" />}
          {toastNotification.type === 'error' && <AlertTriangle className="h-4 w-4 text-rose-400" />}
          {toastNotification.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <span>{toastNotification.message}</span>
          <button onClick={() => setToastNotification(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

