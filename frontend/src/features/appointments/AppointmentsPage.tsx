import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Plus, 
  CheckCircle2, 
  X,
  Stethoscope
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { MOCK_APPOINTMENTS, SAMPLE_APPOINTMENTS } from '../../api/mockData';
import { Appointment } from '../../types';
import { formatDate } from '../../lib/utils';

const DEMO_IDS = ['pat-001', 'pat-002', 'pat-003'];

export const AppointmentsPage: React.FC = () => {
  const { activePatient } = usePatient();

  // For demo accounts use their specific mock appointments.
  // For all other users inject the sample appointments as default.
  const baseAppointments = activePatient && DEMO_IDS.includes(activePatient.id)
    ? MOCK_APPOINTMENTS.filter((a) => a.patientId === activePatient.id)
    : SAMPLE_APPOINTMENTS.map((a) => ({ ...a, patientId: activePatient?.id ?? '__sample__' }));

  const [appointments, setAppointments] = useState<Appointment[]>(baseAppointments);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New appointment form
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState('2026-12-25');
  const [time] = useState('11:00 AM');
  const [type, setType] = useState<'in-person' | 'video'>('in-person');

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !hospital || !activePatient) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: activePatient.id,
      doctorName,
      specialty,
      hospital,
      date,
      time,
      status: 'upcoming',
      type,
    };
    setAppointments([newApt, ...appointments]);
    setIsBookModalOpen(false);
    setDoctorName('');
    setHospital('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Appointments & Consultations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your hospital visits and video tele-consultations
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Book Consultation
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
            No appointments scheduled
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Click "Book Consultation" to schedule your next doctor visit.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 space-y-4 ${
                apt.status === 'completed'
                  ? 'border-slate-200 opacity-80 dark:border-slate-700'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {apt.specialty}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  {apt.type === 'video' ? (
                    <>
                      <Video className="h-3.5 w-3.5 text-blue-500" /> Video Call
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-amber-500" /> In-Person
                    </>
                  )}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {apt.doctorName}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{apt.hospital}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-1">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  <span>{formatDate(apt.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  <span>{apt.time}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-500 italic">
                  Note: "{apt.notes}"
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                {apt.status === 'completed' ? (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                ) : apt.status === 'cancelled' ? (
                  <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Cancelled
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed · Upcoming
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600" /> Book Consultation
              </h2>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Mehra"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hospital / Clinic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Max Healthcare, Saket"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mode
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="video">Video Call</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
