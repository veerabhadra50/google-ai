import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { CHIT_GROUPS, ZONE_COORDINATES } from '../data/mockChitData.ts';
import type { FieldTask, FieldWorker, TaskType } from '../types.ts';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: FieldWorker[];
  defaultWorkerId: string;
  onAssignTask: (task: Omit<FieldTask, 'id' | 'status' | 'createdAt'>) => void;
}

const NEIGHBORHOODS = Object.keys(ZONE_COORDINATES);

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  workers,
  defaultWorkerId,
  onAssignTask,
}) => {
  const [type, setType] = useState<TaskType>('chit_collection');
  const [workerId, setWorkerId] = useState(defaultWorkerId);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [chitGroupId, setChitGroupId] = useState(CHIT_GROUPS[0]);
  const [amountDue, setAmountDue] = useState('12500');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    setWorkerId(defaultWorkerId);
  }, [defaultWorkerId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const baseCoords = ZONE_COORDINATES[neighborhood] ?? ZONE_COORDINATES.Indiranagar;
    const jitterX = Math.round((Math.random() - 0.5) * 36);
    const jitterY = Math.round((Math.random() - 0.5) * 36);

    onAssignTask({
      workerId,
      type,
      customerName: customerName.trim(),
      phone: phone.trim() || '+91 98450 00000',
      chitGroupId,
      amountDue: Math.max(500, Number(amountDue) || 10000),
      neighborhood,
      mapX: Math.max(40, Math.min(960, baseCoords.x + jitterX)),
      mapY: Math.max(40, Math.min(580, baseCoords.y + jitterY)),
      notes: notes.trim() || undefined,
    });

    setCustomerName('');
    setPhone('+91 ');
    setNotes('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-task-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="assign-task-title" className="text-base font-semibold text-slate-900">
            Assign Field Task or Enquiry
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Task Type Segmented Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('chit_collection')}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                type === 'chit_collection'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chit Collection
            </button>
            <button
              type="button"
              onClick={() => setType('new_enquiry')}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                type === 'new_enquiry'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Customer Enquiry
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="assign-worker" className="block text-xs font-medium text-slate-700">
                Assign Field Worker
              </label>
              <select
                id="assign-worker"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="assign-zone" className="block text-xs font-medium text-slate-700">
                Locality / Zone
              </label>
              <select
                id="assign-zone"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {NEIGHBORHOODS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="customer-name" className="block text-xs font-medium text-slate-700">
                {type === 'chit_collection' ? 'Member / Business Name' : 'Prospect Name'}
              </label>
              <input
                id="customer-name"
                type="text"
                required
                placeholder="e.g. Balaji Enterprises"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="customer-phone" className="block text-xs font-medium text-slate-700">
                Contact Number
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="chit-group" className="block text-xs font-medium text-slate-700">
                Chit Group ID
              </label>
              <select
                id="chit-group"
                value={chitGroupId}
                onChange={(e) => setChitGroupId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {CHIT_GROUPS.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="amount-inr" className="block text-xs font-medium text-slate-700">
                {type === 'chit_collection' ? 'Installment Amount (₹)' : 'Target Monthly Slab (₹)'}
              </label>
              <input
                id="amount-inr"
                type="number"
                min={500}
                step={500}
                required
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-notes" className="block text-xs font-medium text-slate-700">
              Field Instructions (Optional)
            </label>
            <input
              id="task-notes"
              type="text"
              placeholder="e.g. Collect before 4 PM, ask for passbook signature"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dispatch to Worker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
