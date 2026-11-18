import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  PauseCircle,
  PlayCircle,
  Plus,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  ClipboardList,
} from 'lucide-react';
import { LiveFieldMap } from './LiveFieldMap.tsx';
import { formatDuration, formatINR } from '../utils/alarmAudio.ts';
import type { AlertNotification, FieldTask, FieldWorker, ThresholdMode } from '../types.ts';

interface ManagerDashboardProps {
  workers: FieldWorker[];
  tasks: FieldTask[];
  alerts: AlertNotification[];
  selectedWorkerId: string;
  onSelectWorker: (workerId: string) => void;
  thresholdMode: ThresholdMode;
  onChangeThresholdMode: (mode: ThresholdMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTestAlarm: () => void;
  onSimulateStop: (workerId: string) => void;
  onResumeWorker: (workerId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onOpenAssignModal: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  workers,
  tasks,
  alerts,
  selectedWorkerId,
  onSelectWorker,
  thresholdMode,
  onChangeThresholdMode,
  isMuted,
  onToggleMute,
  onTestAlarm,
  onSimulateStop,
  onResumeWorker,
  onAcknowledgeAlert,
  onOpenAssignModal,
}) => {
  const [rightTab, setRightTab] = useState<'fleet' | 'alerts' | 'tasks'>('fleet');

  const totalCash = workers.reduce((acc, w) => acc + w.cashCollected, 0);
  const totalUpi = workers.reduce((acc, w) => acc + w.upiCollected, 0);
  const totalRevenue = totalCash + totalUpi;
  const activeShiftCount = workers.filter((w) => w.onShift).length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const stationaryAlerts = workers.filter((w) => w.status === 'stationary_alert');
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) ?? workers[0];

  return (
    <div className="space-y-4">
      {/* Flashing Red Alert Banner when any worker exceeds stationary threshold */}
      {stationaryAlerts.length > 0 && (
        <div
          role="alert"
          className="bg-red-600 text-white rounded-xl px-4 py-3 shadow-md border border-red-700 animate-pulse flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <div className="text-xs sm:text-sm space-y-0.5">
              <p className="font-semibold">
                STATIONARY WORKER ALERT — Alert Message Sent to Manager &amp; Admin
              </p>
              <p className="text-red-100">
                {stationaryAlerts
                  .map(
                    (w) =>
                      `${w.name} stationary for ${formatDuration(w.idleSeconds)} at ${w.currentLocationLabel}`
                  )
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {stationaryAlerts.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onResumeWorker(w.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-white text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Acknowledge &amp; Resume {w.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4-Column Live KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Collected Today</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatINR(totalRevenue)}
          </p>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            {tasks.filter((t) => t.status === 'completed').length} receipts settled
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cash vs UPI Split</span>
            <IndianRupee className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
            {formatINR(totalCash)} <span className="text-slate-400 font-normal">/</span>{' '}
            {formatINR(totalUpi)}
          </p>
          <p className="text-xs text-slate-500">Cash in hand · Verified UPI</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Field Force</span>
            <Users className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {activeShiftCount} / {workers.length}
          </p>
          <p className="text-xs text-slate-500">
            {stationaryAlerts.length > 0 ? (
              <span className="text-red-600 font-medium">
                {stationaryAlerts.length} stationary alert
              </span>
            ) : (
              'All active routes nominal'
            )}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Tasks &amp; Leads</span>
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {pendingTasks.length}
          </p>
          <p className="text-xs text-slate-500">
            {pendingTasks.filter((t) => t.type === 'new_enquiry').length} enquiries ·{' '}
            {pendingTasks.filter((t) => t.type === 'chit_collection').length} collections
          </p>
        </div>
      </section>

      {/* Inactivity Monitor & Simulation Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-700">Inactivity Monitor:</span>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onChangeThresholdMode('demo_15s')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                thresholdMode === 'demo_15s'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo (15s)
            </button>
            <button
              type="button"
              onClick={() => onChangeThresholdMode('real_15m')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                thresholdMode === 'real_15m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Real (15m)
            </button>
          </div>

          <button
            type="button"
            onClick={() => selectedWorker && onSimulateStop(selectedWorker.id)}
            disabled={!selectedWorker?.onShift}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Simulate Worker Stop / Idle ({selectedWorker?.name.split(' ')[0]})
            </span>
          </button>

          {selectedWorker?.status === 'stationary_alert' && (
            <button
              type="button"
              onClick={() => onResumeWorker(selectedWorker.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Resume Worker</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTestAlarm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Test Alarm</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isMuted
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Siren Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Audio Armed</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Main Map + Telemetry / Alert Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-7">
          <LiveFieldMap
            workers={workers}
            tasks={tasks}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={onSelectWorker}
          />
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
          {/* Panel Tabs */}
          <div className="px-4 pt-3 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setRightTab('fleet')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  rightTab === 'fleet'
                    ? 'border-indigo-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Live Fleet ({workers.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab('alerts')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  rightTab === 'alerts'
                    ? 'border-indigo-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Alert Center ({unreadAlerts > 0 ? `${unreadAlerts} new` : alerts.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab('tasks')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  rightTab === 'tasks'
                    ? 'border-indigo-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Tasks &amp; Leads ({pendingTasks.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAssignModal}
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Assign</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto max-h-[455px] divide-y divide-slate-100">
            {rightTab === 'fleet' &&
              workers.map((w) => {
                const isSelected = w.id === selectedWorkerId;
                const total = w.cashCollected + w.upiCollected;
                return (
                  <div
                    key={w.id}
                    onClick={() => onSelectWorker(w.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              !w.onShift
                                ? 'bg-slate-400'
                                : w.status === 'stationary_alert'
                                  ? 'bg-red-600 animate-ping'
                                  : w.status === 'at_customer'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {w.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {w.employeeCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {w.onShift ? w.currentLocationLabel : 'Off Shift · GPS Paused'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                          {formatINR(total)}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-slate-500">
                          {w.onShift ? (
                            w.status === 'stationary_alert' ? (
                              <span className="text-red-600 font-semibold">
                                Idle {formatDuration(w.idleSeconds)}
                              </span>
                            ) : (
                              `Idle ${formatDuration(w.idleSeconds)}`
                            )
                          ) : (
                            'Offline'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Cash {formatINR(w.cashCollected)} · UPI {formatINR(w.upiCollected)}
                      </span>
                      {w.status === 'stationary_alert' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumeWorker(w.id);
                          }}
                          className="text-red-700 font-semibold hover:underline"
                        >
                          Clear Alert
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSimulateStop(w.id);
                          }}
                          disabled={!w.onShift}
                          className="text-slate-600 hover:text-red-600 disabled:opacity-40"
                        >
                          Simulate Stop
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {rightTab === 'alerts' &&
              (alerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No notifications logged yet.</div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 space-y-1 ${
                      !alert.acknowledged && alert.type === 'inactivity' ? 'bg-red-50/70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          alert.type === 'inactivity'
                            ? 'text-red-700'
                            : alert.type === 'enquiry'
                              ? 'text-sky-700'
                              : 'text-slate-900'
                        }`}
                      >
                        {alert.workerName}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{alert.message}</p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[11px] text-slate-500">{alert.location}</span>
                      {!alert.acknowledged && (
                        <button
                          type="button"
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="text-[11px] font-medium text-indigo-600 hover:underline"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ))}

            {rightTab === 'tasks' &&
              tasks.map((task) => {
                const worker = workers.find((w) => w.id === task.workerId);
                return (
                  <div key={task.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {task.customerName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {task.chitGroupId} · {task.neighborhood} · {worker?.name ?? 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {task.type === 'new_enquiry' ? 'New Enquiry' : 'Chit Collection'} ·{' '}
                        {task.createdAt}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold font-mono tabular-nums text-slate-900">
                        {formatINR(task.collectedAmount ?? task.amountDue)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {task.status === 'completed' ? `${task.paymentMode} Paid` : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
