import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, Save, AlertCircle, Ban, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorsApi } from '../services/api';
import { DoctorAvailability } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorAvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Block date state
  const [blockedDate, setBlockedDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  const doctorId = user?.doctor_profile?.id || 1;

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await doctorsApi.getAvailability(doctorId);
      // Ensure all 7 days represented
      const fullList: DoctorAvailability[] = [];
      for (let day = 0; day < 7; day++) {
        const found = data.find((d) => d.day_of_week === day);
        if (found) {
          fullList.push(found);
        } else {
          fullList.push({
            id: 0,
            doctor_id: doctorId,
            day_of_week: day,
            start_time: '09:00',
            end_time: '18:00',
            slot_duration_minutes: 30,
            break_start_time: '13:00',
            break_end_time: '14:00',
            is_active: day !== 6, // Active Mon-Sat, Sunday off by default
          });
        }
      }
      setAvailabilities(fullList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [doctorId]);

  const handleFieldChange = (dayIndex: number, field: keyof DoctorAvailability, val: any) => {
    const updated = [...availabilities];
    updated[dayIndex] = { ...updated[dayIndex], [field]: val };
    setAvailabilities(updated);
  };

  const handleSaveDay = async (dayIndex: number) => {
    const item = availabilities[dayIndex];
    try {
      await doctorsApi.setAvailability({
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        slot_duration_minutes: Number(item.slot_duration_minutes),
        break_start_time: item.break_start_time || undefined,
        break_end_time: item.break_end_time || undefined,
        is_active: item.is_active,
      });
      setSavedSuccess(`Saved schedule for ${DAYS[dayIndex]}`);
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (e) {
      console.error('Failed to save day:', e);
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const item of availabilities) {
        await doctorsApi.setAvailability({
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          slot_duration_minutes: Number(item.slot_duration_minutes),
          break_start_time: item.break_start_time || undefined,
          break_end_time: item.break_end_time || undefined,
          is_active: item.is_active,
        });
      }
      setSavedSuccess('All consultation days successfully updated!');
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (e) {
      console.error('Failed to save all:', e);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedDate) return;
    try {
      await doctorsApi.blockDate({
        blocked_date: blockedDate,
        reason: blockReason || 'Doctor unavailable',
      });
      setBlockSuccess(`Successfully blocked date: ${blockedDate}`);
      setBlockedDate('');
      setBlockReason('');
      setTimeout(() => setBlockSuccess(null), 4000);
    } catch (e) {
      console.error('Failed to block date:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/dashboard/doctor"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Doctor Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary-600" /> Consultation Hours & Availability
            </h1>
            <p className="text-xs text-slate-500">
              Configure your weekly outpatient consultation schedule, slot intervals, and lunch breaks.
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary-600/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" /> Save Weekly Schedule
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-mint-50 border border-mint-200 text-xs font-semibold text-mint-800 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-mint-600" /> {savedSuccess}
          </div>
        )}

        {/* Weekly Day Schedule Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Weekly Working Hours by Day
          </h2>

          <div className="space-y-3">
            {availabilities.map((item, idx) => (
              <div
                key={item.day_of_week}
                className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  item.is_active ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-100/40 border-slate-200/40 opacity-70'
                }`}
              >
                {/* Day & Active Toggle */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={(e) => handleFieldChange(idx, 'is_active', e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className={`text-sm font-bold ${item.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {DAYS[item.day_of_week]}
                  </span>
                </div>

                {/* Timing Inputs */}
                {item.is_active ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-xl text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={item.start_time}
                        onChange={(e) => handleFieldChange(idx, 'start_time', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={item.end_time}
                        onChange={(e) => handleFieldChange(idx, 'end_time', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Slot Length</label>
                      <select
                        value={item.slot_duration_minutes}
                        onChange={(e) => handleFieldChange(idx, 'slot_duration_minutes', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-primary-500"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Lunch Break</label>
                      <input
                        type="text"
                        placeholder="13:00-14:00"
                        value={item.break_start_time ? `${item.break_start_time}-${item.break_end_time}` : ''}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          handleFieldChange(idx, 'break_start_time', parts[0] || '');
                          handleFieldChange(idx, 'break_end_time', parts[1] || '');
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-medium focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Off duty / Unavailable for booking</div>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveDay(idx)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors self-end sm:self-center"
                >
                  Save Day
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Block Out Dates (Vacations, Leave) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Block Unavailable Dates
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Block specific dates for medical conferences, leave, or emergency personal time off. Parents will not be able to book slots on blocked dates.
          </p>

          {blockSuccess && (
            <div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs text-mint-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-mint-600" /> {blockSuccess}
            </div>
          )}

          <form onSubmit={handleBlockDate} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Date to Block *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={blockedDate}
                onChange={(e) => setBlockedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Blocking</label>
              <input
                type="text"
                placeholder="e.g. Annual Pediatrics Conference / CME"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Block This Date
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
