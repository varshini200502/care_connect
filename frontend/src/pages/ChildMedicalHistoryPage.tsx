import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Calendar,
  AlertTriangle,
  History,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { childrenApi, prescriptionsApi, medicalRecordsApi } from '../services/api';
import { Child, Prescription, MedicalRecord } from '../types';

export const ChildMedicalHistoryPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { user, isDoctor } = useAuth();

  const [child, setChild] = useState<Child | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Record Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordType, setRecordType] = useState('LAB_REPORT');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    if (!childId) return;
    try {
      setLoading(true);
      const [childData, rxList, recList] = await Promise.all([
        childrenApi.getById(Number(childId)),
        prescriptionsApi.getByChild(Number(childId)),
        medicalRecordsApi.getByChild(Number(childId)),
      ]);
      setChild(childData);
      setPrescriptions(rxList);
      setRecords(recList);
    } catch (e) {
      console.error('Failed to load child history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !childId) return;
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('child_id', childId);
      formData.append('title', recordTitle);
      formData.append('record_type', recordType);
      formData.append('notes', notes);
      formData.append('file', selectedFile);

      await medicalRecordsApi.upload(formData);
      setUploadModalOpen(false);
      setRecordTitle('');
      setNotes('');
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload medical record.');
    } finally {
      setUploading(false);
    }
  };

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      years--;
    }
    if (years >= 2) return `${years} yrs`;
    const months = (today.getFullYear() - dob.getFullYear()) * 12 + today.getMonth() - dob.getMonth();
    return `${Math.max(1, months)} mos`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            to={isDoctor ? '/dashboard/doctor' : '/dashboard/parent'}
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-6 h-6 text-primary-600" /> Child Health History & Timeline
              </h1>
              <p className="text-xs text-slate-500">
                Complete longitudinal record of consultations, digital prescriptions, and uploaded clinical files.
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" /> Upload Medical Record
            </button>
          </div>
        </div>

        {/* Patient Overview Card */}
        {child && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-mint-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{child.full_name}</h2>
                  <p className="text-xs text-slate-500">
                    Age: <b className="text-slate-800">{calculateAge(child.date_of_birth)}</b> (DOB: {child.date_of_birth}) • {child.gender || 'Child'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                  Blood Group: {child.blood_group || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Allergies & Hypersensitivities
                </span>
                <p className="text-rose-950 font-semibold">{child.allergies || 'None reported'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Existing Medical Conditions & History
                </span>
                <p className="text-slate-800">{child.existing_conditions || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chronological Health Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-mint-600" /> Clinical Timeline
          </h2>

          <div className="space-y-4">
            {/* Prescriptions in Timeline */}
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-mint-50 text-mint-700 border border-mint-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Digital Prescription</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          #{rx.prescription_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Consultation Date: {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => prescriptionsApi.downloadPdf(rx.id, rx.prescription_number)}
                    className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors self-end sm:self-center"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Official PDF
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Diagnosis:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{rx.diagnosis}</p>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Medicine Name</th>
                          <th className="px-4 py-2">Dosage</th>
                          <th className="px-4 py-2">Frequency</th>
                          <th className="px-4 py-2">Duration</th>
                          <th className="px-4 py-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {rx.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{item.medicine_name}</td>
                            <td className="px-4 py-2.5">{item.dosage}</td>
                            <td className="px-4 py-2.5">{item.frequency}</td>
                            <td className="px-4 py-2.5">{item.duration}</td>
                            <td className="px-4 py-2.5 text-slate-500">{item.instructions || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.additional_advice && (
                    <div className="p-3 bg-mint-50/50 rounded-xl text-slate-700">
                      <b>Advice:</b> {rx.additional_advice}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Uploaded Records in Timeline */}
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-700 border border-primary-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rec.title}</h3>
                    <p className="text-xs text-slate-400">
                      Type: <b className="text-slate-600">{rec.record_type}</b> • Uploaded on{' '}
                      {new Date(rec.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {rec.notes && <p className="text-xs text-slate-600 mt-1">{rec.notes}</p>}
                  </div>
                </div>

                <button
                  onClick={() => medicalRecordsApi.download(rec.id, rec.file_name)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> View File
                </button>
              </div>
            ))}

            {prescriptions.length === 0 && records.length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
                No clinical records or prescriptions on file yet for this child.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Medical Record Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Upload Pediatric Document</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Immunization Card / Blood Count Lab Report"
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Record Category
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="LAB_REPORT">Lab Test Report</option>
                  <option value="VACCINATION">Vaccination / Immunization Card</option>
                  <option value="IMAGING">X-Ray / Ultrasound Scan</option>
                  <option value="CONSULTATION_NOTE">Previous Doctor Prescription</option>
                  <option value="OTHER">Other Clinical Record</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select File (PDF, PNG, JPG, max 15MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any notes for the pediatrician regarding this report..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
