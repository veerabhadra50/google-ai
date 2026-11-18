import React, { useState } from 'react';
import {
  MapPin,
  Power,
  IndianRupee,
  CheckCircle2,
  PlusCircle,
  ClipboardList,
  Navigation,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { CHIT_GROUPS, ZONE_COORDINATES } from '../data/mockChitData.ts';
import { formatDuration, formatINR } from '../utils/alarmAudio.ts';
import type { FieldTask, FieldWorker, PaymentMode } from '../types.ts';

interface WorkerMobileSimulatorProps {
  workers: FieldWorker[];
  selectedWorkerId: string;
  onSelectWorker: (workerId: string) => void;
  tasks: FieldTask[];
  onToggleShift: (workerId: string) => void;
  onResumeFromAlert: (workerId: string) => void;
  onCollectPayment: (taskId: string, amount: number, mode: PaymentMode) => void;
  onSubmitFieldEnquiry: (payload: {
    workerId: string;
    customerName: string;
    phone: string;
    chitGroupId: string;
    amountDue: number;
    neighborhood: string;
    notes?: string;
  }) => void;
}

const NEIGHBORHOODS = Object.keys(ZONE_COORDINATES);

export const WorkerMobileSimulator: React.FC<WorkerMobileSimulatorProps> = ({
  workers,
  selectedWorkerId,
  onSelectWorker,
  tasks,
  onToggleShift,
  onResumeFromAlert,
  onCollectPayment,
  onSubmitFieldEnquiry,
}) => {
  const [mobileTab, setMobileTab] = useState<'tasks' | 'enquiry' | 'summary'>('tasks');
  const [collectingTask, setCollectingTask] = useState<FieldTask | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentAmount, setPaymentAmount] = useState('');

  // New Field Enquiry state
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('+91 ');
  const [leadGroup, setLeadGroup] = useState(CHIT_GROUPS[0]);
  const [leadAmount, setLeadAmount] = useState('10000');
  const [leadZone, setLeadZone] = useState(NEIGHBORHOODS[0]);
  const [leadNotes, setLeadNotes] = useState('');
  const [enquirySubmittedToast, setEnquirySubmittedToast] = useState(false);

  const worker = workers.find((w) => w.id === selectedWorkerId) ?? workers[0];
  const workerTasks = tasks.filter((t) => t.workerId === worker.id);
  const pendingTasks = workerTasks.filter((t) => t.status === 'pending');
  const completedTasks = workerTasks.filter((t) => t.status === 'completed');

  const openCollectSheet = (task: FieldTask) => {
    setCollectingTask(task);
    setPaymentAmount(String(task.amountDue));
    setPaymentMode('UPI');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingTask) return;
    const amt = Math.max(100, Number(paymentAmount) || collectingTask.amountDue);
    onCollectPayment(collectingTask.id, amt, paymentMode);
    setCollectingTask(null);
  };

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) return;
    onSubmitFieldEnquiry({
      workerId: worker.id,
      customerName: leadName.trim(),
      phone: leadPhone.trim() || '+91 98450 00000',
      chitGroupId: leadGroup,
      amountDue: Math.max(500, Number(leadAmount) || 10000),
      neighborhood: leadZone,
      notes: leadNotes.trim() || undefined,
    });
    setLeadName('');
    setLeadPhone('+91 ');
    setLeadNotes('');
    setEnquirySubmittedToast(true);
    window.setTimeout(() => setEnquirySubmittedToast(false), 2500);
    setMobileTab('tasks');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Simulator Worker Selector above Phone Frame */}
      <div className="w-full max-w-[400px] mb-3 flex items-center justify-between gap-2">
        <label htmlFor="sim-worker-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Simulate Agent:
        </label>
        <select
          id="sim-worker-select"
          value={worker.id}
          onChange={(e) => onSelectWorker(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} · {w.zone}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Device Simulator Frame */}
      <div className="w-full max-w-[400px] h-[680px] bg-slate-50 border-[6px] border-slate-900 rounded-[2.25rem] shadow-xl overflow-hidden flex flex-col relative">
        {/* Mobile App Top Bar */}
        <div className="bg-slate-900 text-white px-4 pt-3.5 pb-3 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{worker.name}</p>
              <p className="text-[11px] text-slate-300 truncate">
                {worker.employeeCode} · {worker.zone}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleShift(worker.id)}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                worker.onShift
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              <Power className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{worker.onShift ? 'End Shift' : 'Start Shift'}</span>
            </button>
          </div>

          {/* Live GPS & Collection Strip */}
          <div className="flex items-center justify-between text-[11px] bg-slate-800/90 rounded-lg px-3 py-1.5">
            <span className="inline-flex items-center gap-1.5 text-slate-200 truncate">
              <Navigation className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {worker.onShift ? worker.currentLocationLabel : 'GPS Tracking Paused'}
              </span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400 shrink-0 ml-2">
              {formatINR(worker.cashCollected + worker.upiCollected)}
            </span>
          </div>
        </div>

        {/* Toast on Field Enquiry Submission */}
        {enquirySubmittedToast && (
          <div className="mx-3 mt-2.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>New enquiry sent to Manager Command Center.</span>
          </div>
        )}

        {/* Scrollable Mobile Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {mobileTab === 'tasks' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700">
                  Assigned Queue ({pendingTasks.length} pending)
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {completedTasks.length} completed
                </span>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="p-6 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">All assigned stops completed</p>
                  <p className="text-xs text-slate-500">
                    Submit a new field enquiry or wait for Manager dispatch.
                  </p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {task.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {task.type === 'new_enquiry' ? 'New Enquiry' : 'Chit Collection'} ·{' '}
                          <span className="font-mono">{task.chitGroupId}</span>
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900 shrink-0">
                        {formatINR(task.amountDue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{task.neighborhood}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 shrink-0">
                        <Phone className="w-3 h-3" />
                        {task.phone}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        {task.notes}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => openCollectSheet(task)}
                      className="w-full min-h-[44px] flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      <IndianRupee className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {task.type === 'new_enquiry' ? 'Collect Booking / Update Lead' : 'Collect Payment'}
                      </span>
                    </button>
                  </div>
                ))
              )}

              {completedTasks.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h4 className="text-xs font-medium text-slate-500">Completed Today</h4>
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {task.customerName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {task.paymentMode} · {task.completedAt}
                        </p>
                      </div>
                      <span className="text-xs font-semibold font-mono tabular-nums text-emerald-700 shrink-0">
                        {formatINR(task.collectedAmount ?? task.amountDue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {mobileTab === 'enquiry' && (
            <form onSubmit={handleCreateEnquiry} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Submit Field Enquiry</h3>
                <p className="text-xs text-slate-500">
                  Instantly notifies the Manager Command Center.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="lead-name" className="block text-xs font-medium text-slate-700">
                  Prospect / Shop Name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  required
                  placeholder="e.g. Anand Medical Hall"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="lead-phone" className="block text-xs font-medium text-slate-700">
                  Mobile Number
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="lead-group" className="block text-xs font-medium text-slate-700">
                    Chit Plan
                  </label>
                  <select
                    id="lead-group"
                    value={leadGroup}
                    onChange={(e) => setLeadGroup(e.target.value)}
                    className="w-full px-2.5 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900"
                  >
                    {CHIT_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="lead-amount" className="block text-xs font-medium text-slate-700">
                    Monthly ₹
                  </label>
                  <input
                    id="lead-amount"
                    type="number"
                    min={500}
                    step={500}
                    value={leadAmount}
                    onChange={(e) => setLeadAmount(e.target.value)}
                    className="w-full px-2.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="lead-zone" className="block text-xs font-medium text-slate-700">
                  Locality
                </label>
                <select
                  id="lead-zone"
                  value={leadZone}
                  onChange={(e) => setLeadZone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                >
                  {NEIGHBORHOODS.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="lead-notes" className="block text-xs font-medium text-slate-700">
                  Notes
                </label>
                <input
                  id="lead-notes"
                  type="text"
                  placeholder="Callback preference or business type"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Submit Enquiry to Manager
              </button>
            </form>
          )}

          {mobileTab === 'summary' && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Shift Telemetry</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="block text-[11px] text-slate-500">Cash Collected</span>
                    <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatINR(worker.cashCollected)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="block text-[11px] text-slate-500">UPI Collected</span>
                    <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatINR(worker.upiCollected)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <p>
                    GPS Coordinates:{' '}
                    <span className="font-mono tabular-nums">
                      {worker.lat.toFixed(4)}, {worker.lng.toFixed(4)}
                    </span>
                  </p>
                  <p>
                    Idle Timer:{' '}
                    <span className="font-mono tabular-nums">{formatDuration(worker.idleSeconds)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Thumb Navigation Bar */}
        <div className="bg-white border-t border-slate-200 grid grid-cols-3 h-16 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('tasks')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              mobileTab === 'tasks' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>My Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('enquiry')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              mobileTab === 'enquiry' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Enquiry</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('summary')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              mobileTab === 'summary' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <IndianRupee className="w-5 h-5" />
            <span>Settlement</span>
          </button>
        </div>

        {/* Collect Payment Bottom Sheet inside Phone Frame */}
        {collectingTask && (
          <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-xs flex items-end">
            <form
              onSubmit={handleConfirmPayment}
              className="w-full bg-white rounded-t-3xl p-4 space-y-3.5 shadow-xl"
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {collectingTask.customerName}
                </h4>
                <p className="text-xs text-slate-500">
                  {collectingTask.chitGroupId} · {collectingTask.neighborhood}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(['UPI', 'Cash'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`min-h-[40px] text-xs font-semibold rounded-lg transition-colors ${
                      paymentMode === mode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label htmlFor="collect-amt" className="block text-xs font-medium text-slate-700">
                  Amount Collected (₹)
                </label>
                <input
                  id="collect-amt"
                  type="number"
                  min={100}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-base font-bold font-mono tabular-nums bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCollectingTask(null)}
                  className="min-h-[44px] text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stationary Inactivity Warning Popup on Field Worker's Mobile Screen */}
        {worker.status === 'stationary_alert' && (
          <div className="absolute inset-0 z-30 bg-red-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full bg-white rounded-2xl p-5 text-center space-y-3 shadow-2xl border border-red-200">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Stationary Alert Triggered</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have been stationary for{' '}
                  <span className="font-mono font-semibold text-red-600">
                    {formatDuration(worker.idleSeconds)}
                  </span>{' '}
                  at {worker.currentLocationLabel}. Manager &amp; Admin have been notified.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onResumeFromAlert(worker.id)}
                className="w-full min-h-[46px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Confirm Active &amp; Resume Route
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
