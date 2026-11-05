import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, CheckCircle, Download, AlertCircle } from 'lucide-react';
import { Appointment, PrescriptionItem } from '../types';
import { prescriptionsApi } from '../services/api';

interface PrescriptionModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [additionalAdvice, setAdditionalAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRx, setCreatedRx] = useState<{ id: number; prescription_number: string } | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'medicine_name' | 'dosage' | 'frequency' | 'duration' | 'instructions', value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!diagnosis.trim()) {
      setError('Please provide a clinical diagnosis or assessment.');
      return;
    }

    const validItems = items.filter((item) => item.medicine_name.trim());
    if (validItems.length === 0) {
      setError('Please specify at least one prescribed medication.');
      return;
    }

    setLoading(true);
    try {
      const rx = await prescriptionsApi.create({
        appointment_id: appointment.id,
        diagnosis,
        additional_advice: additionalAdvice,
        follow_up_date: followUpDate || undefined,
        items: validItems,
      });

      setCreatedRx({ id: rx.id, prescription_number: rx.prescription_number });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate digital prescription.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (createdRx) {
      await prescriptionsApi.downloadPdf(createdRx.id, createdRx.prescription_number);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-mint-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Digital Pediatric Prescription</h3>
              <p className="text-xs text-white/80">
                Patient: <span className="font-semibold">{appointment.child.full_name}</span> | Parent: {appointment.doctor.user?.full_name ? appointment.child.full_name : 'Guardian'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {createdRx ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-mint-100 text-mint-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                Prescription #{createdRx.prescription_number} Generated!
              </h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                The digital prescription has been securely saved, sent to the parent, and posted directly into the consultation chat room.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-600/20 hover:bg-primary-700 flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Download className="w-4 h-4" /> Download Official PDF
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {/* Diagnosis Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Diagnosis & Assessment *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Viral Bronchitis / Atopic Dermatitis flare-up"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* Prescribed Medications Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ℞ Prescribed Medications *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 relative"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Medicine Name & Form
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Paracetamol Syrup (250mg/5ml)"
                            value={item.medicine_name}
                            onChange={(e) => handleItemChange(idx, 'medicine_name', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Dosage
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 5 ml"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Frequency
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Thrice daily"
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-end gap-1">
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 3 Days"
                              value={item.duration}
                              onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Administration instructions (e.g. Give after food with warm water)"
                          value={item.instructions || ''}
                          onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                          className="w-full px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Advice & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dietary & Lifestyle Advice
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Warm saline gargles, adequate fluid intake, avoid dusty environment."
                    value={additionalAdvice}
                    onChange={(e) => setAdditionalAdvice(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recommended Follow-up Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional re-evaluation appointment date</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 disabled:opacity-50 flex items-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  {loading ? 'Generating PDF...' : 'Sign & Issue Prescription'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
