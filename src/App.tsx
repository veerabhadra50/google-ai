/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { INITIAL_ALERTS, INITIAL_TASKS, INITIAL_WORKERS, ZONE_COORDINATES } from './data/mockChitData.ts';
import { ManagerDashboard } from './components/ManagerDashboard.tsx';
import { WorkerMobileSimulator } from './components/WorkerMobileSimulator.tsx';
import { AssignTaskModal } from './components/AssignTaskModal.tsx';
import {
  formatDuration,
  formatINR,
  playChime,
  playWarningPulse,
  startWarningSiren,
  stopWarningSiren,
} from './utils/alarmAudio.ts';
import type {
  AlertNotification,
  FieldTask,
  FieldWorker,
  PaymentMode,
  ThresholdMode,
  ViewMode,
} from './types.ts';

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [thresholdMode, setThresholdMode] = useState<ThresholdMode>('demo_15s');
  const [isMuted, setIsMuted] = useState(false);

  const [workers, setWorkers] = useState<FieldWorker[]>(INITIAL_WORKERS);
  const [tasks, setTasks] = useState<FieldTask[]>(INITIAL_TASKS);
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(INITIAL_WORKERS[0].id);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const thresholdSeconds = thresholdMode === 'demo_15s' ? 15 : 900;

  // Real-time 1s Simulation Engine: moves active workers & monitors stationary thresholds
  useEffect(() => {
    const interval = window.setInterval(() => {
      const newlyAlertedWorkers: FieldWorker[] = [];

      setWorkers((prev) =>
        prev.map((w) => {
          if (!w.onShift) return w;

          // Stationary or at customer -> increment idle timer
          if (w.simulatedStop || w.status === 'at_customer' || w.status === 'stationary_alert') {
            const nextIdle = w.idleSeconds + 1;
            const crossedThreshold = nextIdle >= thresholdSeconds;
            const nextStatus = crossedThreshold ? 'stationary_alert' : w.status;

            if (crossedThreshold && !w.alertSent) {
              newlyAlertedWorkers.push({
                ...w,
                idleSeconds: nextIdle,
                status: 'stationary_alert',
                alertSent: true,
              });
            }

            return {
              ...w,
              idleSeconds: nextIdle,
              status: nextStatus,
              alertSent: w.alertSent || crossedThreshold,
              lastUpdated: 'Just now',
            };
          }

          // Moving along assigned route waypoints
          const pts = w.routePoints;
          if (pts.length < 2) return w;
          const currentPt = pts[w.routeIndex % pts.length];
          const nextIdx = (w.routeIndex + 1) % pts.length;
          const nextPt = pts[nextIdx];

          let nextProgress = w.routeProgress + 0.045;
          let updatedIndex = w.routeIndex;

          if (nextProgress >= 1) {
            nextProgress = 0;
            updatedIndex = nextIdx;
          }

          const fromPt = pts[updatedIndex % pts.length];
          const toPt = pts[(updatedIndex + 1) % pts.length];

          const mapX = fromPt.x + (toPt.x - fromPt.x) * nextProgress;
          const mapY = fromPt.y + (toPt.y - fromPt.y) * nextProgress;
          const lat = fromPt.lat + (toPt.lat - fromPt.lat) * nextProgress;
          const lng = fromPt.lng + (toPt.lng - fromPt.lng) * nextProgress;

          return {
            ...w,
            routeIndex: updatedIndex,
            routeProgress: nextProgress,
            mapX,
            mapY,
            lat,
            lng,
            currentLocationLabel: nextProgress > 0.5 ? toPt.label : currentPt.label,
            lastUpdated: 'Just now',
          };
        })
      );

      if (newlyAlertedWorkers.length > 0) {
        setAlerts((prev) => [
          ...newlyAlertedWorkers.map((w) => ({
            id: `alert-${Date.now()}-${w.id}`,
            workerId: w.id,
            workerName: w.name,
            type: 'inactivity' as const,
            message: `Alert Message Sent to Manager & Admin: ${w.name} stationary for ${formatDuration(
              w.idleSeconds
            )}.`,
            location: w.currentLocationLabel,
            timestamp: nowTimeLabel(),
            acknowledged: false,
          })),
          ...prev,
        ]);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [thresholdSeconds]);

  // Synchronize Web Audio API siren with active stationary alerts & mute state
  const hasActiveStationaryAlert = workers.some((w) => w.status === 'stationary_alert');
  useEffect(() => {
    if (hasActiveStationaryAlert && !isMuted) {
      startWarningSiren(false);
    } else {
      stopWarningSiren();
    }
    return () => stopWarningSiren();
  }, [hasActiveStationaryAlert, isMuted]);

  const handleSimulateStop = useCallback(
    (workerId: string) => {
      // Fast-forward worker into immediate stationary alert in Demo Mode (or trigger stop)
      const target = workers.find((w) => w.id === workerId);
      if (!target || !target.onShift) return;

      const nextIdle = Math.max(target.idleSeconds, thresholdSeconds);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === workerId
            ? {
                ...w,
                simulatedStop: true,
                status: 'stationary_alert',
                idleSeconds: nextIdle,
                alertSent: true,
              }
            : w
        )
      );

      setAlerts((prev) => [
        {
          id: `alert-${Date.now()}-${workerId}`,
          workerId: target.id,
          workerName: target.name,
          type: 'inactivity',
          message: `Alert Message Sent to Manager & Admin: ${target.name} stationary beyond threshold (${formatDuration(
            nextIdle
          )}).`,
          location: target.currentLocationLabel,
          timestamp: nowTimeLabel(),
          acknowledged: false,
        },
        ...prev,
      ]);
    },
    [workers, thresholdSeconds]
  );

  const handleResumeWorker = useCallback((workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              simulatedStop: false,
              status: w.onShift ? 'moving' : 'off_shift',
              idleSeconds: 0,
              alertSent: false,
            }
          : w
      )
    );
    setAlerts((prev) =>
      prev.map((a) => (a.workerId === workerId && a.type === 'inactivity' ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const handleToggleShift = useCallback((workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id !== workerId) return w;
        const nextOnShift = !w.onShift;
        return {
          ...w,
          onShift: nextOnShift,
          simulatedStop: false,
          idleSeconds: 0,
          alertSent: false,
          status: nextOnShift ? 'moving' : 'off_shift',
        };
      })
    );
  }, []);

  const handleAssignTask = useCallback(
    (payload: Omit<FieldTask, 'id' | 'status' | 'createdAt'>) => {
      const newTask: FieldTask = {
        ...payload,
        id: `task-${Date.now()}`,
        status: 'pending',
        createdAt: nowTimeLabel(),
      };
      setTasks((prev) => [newTask, ...prev]);

      const worker = workers.find((w) => w.id === payload.workerId);
      setAlerts((prev) => [
        {
          id: `assign-${Date.now()}`,
          workerId: payload.workerId,
          workerName: worker?.name ?? 'Field Agent',
          type: 'task_assigned',
          message: `Assigned ${
            payload.type === 'new_enquiry' ? 'New Enquiry' : 'Chit Collection'
          }: ${payload.customerName} (${payload.chitGroupId} · ${formatINR(payload.amountDue)})`,
          location: payload.neighborhood,
          timestamp: nowTimeLabel(),
          acknowledged: true,
        },
        ...prev,
      ]);
      if (!isMuted) playChime();
    },
    [workers, isMuted]
  );

  const handleCollectPayment = useCallback(
    (taskId: string, amount: number, mode: PaymentMode) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const completedTime = nowTimeLabel();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed',
                collectedAmount: amount,
                paymentMode: mode,
                completedAt: completedTime,
              }
            : t
        )
      );

      const worker = workers.find((w) => w.id === targetTask.workerId);
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== targetTask.workerId) return w;
          const nextIdx = (w.routeIndex + 1) % w.routePoints.length;
          const nextPt = w.routePoints[nextIdx];
          return {
            ...w,
            cashCollected: mode === 'Cash' ? w.cashCollected + amount : w.cashCollected,
            upiCollected: mode === 'UPI' ? w.upiCollected + amount : w.upiCollected,
            idleSeconds: 0,
            simulatedStop: false,
            alertSent: false,
            status: w.onShift ? 'moving' : 'off_shift',
            routeIndex: nextIdx,
            routeProgress: 0.1,
            mapX: nextPt.x,
            mapY: nextPt.y,
            lat: nextPt.lat,
            lng: nextPt.lng,
            currentLocationLabel: `En route to ${nextPt.label}`,
          };
        })
      );

      setAlerts((prev) => [
        {
          id: `pay-${Date.now()}`,
          workerId: targetTask.workerId,
          workerName: worker?.name ?? 'Field Agent',
          type: 'payment',
          message: `Collected ${formatINR(amount)} via ${mode} from ${targetTask.customerName} (${targetTask.chitGroupId})`,
          location: targetTask.neighborhood,
          timestamp: completedTime,
          acknowledged: true,
        },
        ...prev,
      ]);

      if (!isMuted) playChime();
    },
    [tasks, workers, isMuted]
  );

  const handleSubmitFieldEnquiry = useCallback(
    (payload: {
      workerId: string;
      customerName: string;
      phone: string;
      chitGroupId: string;
      amountDue: number;
      neighborhood: string;
      notes?: string;
    }) => {
      const coords = ZONE_COORDINATES[payload.neighborhood] ?? ZONE_COORDINATES.Indiranagar;
      const newTask: FieldTask = {
        id: `enq-${Date.now()}`,
        workerId: payload.workerId,
        type: 'new_enquiry',
        customerName: payload.customerName,
        phone: payload.phone,
        chitGroupId: payload.chitGroupId,
        amountDue: payload.amountDue,
        neighborhood: payload.neighborhood,
        mapX: coords.x + Math.round((Math.random() - 0.5) * 30),
        mapY: coords.y + Math.round((Math.random() - 0.5) * 30),
        status: 'pending',
        notes: payload.notes,
        createdAt: nowTimeLabel(),
      };
      setTasks((prev) => [newTask, ...prev]);

      // Reset worker idle timer upon field activity
      const worker = workers.find((w) => w.id === payload.workerId);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === payload.workerId
            ? {
                ...w,
                idleSeconds: 0,
                simulatedStop: false,
                alertSent: false,
                status: w.onShift ? 'moving' : 'off_shift',
              }
            : w
        )
      );

      setAlerts((prev) => [
        {
          id: `enq-alert-${Date.now()}`,
          workerId: payload.workerId,
          workerName: worker?.name ?? 'Field Agent',
          type: 'enquiry',
          message: `New field enquiry logged: ${payload.customerName} (${payload.chitGroupId} · ${formatINR(
            payload.amountDue
          )})`,
          location: payload.neighborhood,
          timestamp: nowTimeLabel(),
          acknowledged: false,
        },
        ...prev,
      ]);

      if (!isMuted) playChime();
    },
    [workers, isMuted]
  );

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Three-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setViewMode('split');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          ChitTrack
        </a>

        {/* Zone 2: Dual-View Mode Switcher */}
        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Workspace view mode">
          <button
            type="button"
            onClick={() => setViewMode('manager')}
            className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'manager'
                ? 'border-indigo-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Manager Center
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'split'
                ? 'border-indigo-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('worker')}
            className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'worker'
                ? 'border-indigo-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Worker Mobile
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Assign Task</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Command Center + Mobile Simulator Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5">
        {viewMode === 'manager' && (
          <ManagerDashboard
            workers={workers}
            tasks={tasks}
            alerts={alerts}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={setSelectedWorkerId}
            thresholdMode={thresholdMode}
            onChangeThresholdMode={setThresholdMode}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((m) => !m)}
            onTestAlarm={() => {
              if (!isMuted) playWarningPulse();
            }}
            onSimulateStop={handleSimulateStop}
            onResumeWorker={handleResumeWorker}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onOpenAssignModal={() => setAssignModalOpen(true)}
          />
        )}

        {viewMode === 'worker' && (
          <div className="py-2 flex justify-center">
            <WorkerMobileSimulator
              workers={workers}
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={setSelectedWorkerId}
              tasks={tasks}
              onToggleShift={handleToggleShift}
              onResumeFromAlert={handleResumeWorker}
              onCollectPayment={handleCollectPayment}
              onSubmitFieldEnquiry={handleSubmitFieldEnquiry}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 2xl:grid-cols-12 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <ManagerDashboard
                workers={workers}
                tasks={tasks}
                alerts={alerts}
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={setSelectedWorkerId}
                thresholdMode={thresholdMode}
                onChangeThresholdMode={setThresholdMode}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted((m) => !m)}
                onTestAlarm={() => {
                  if (!isMuted) playWarningPulse();
                }}
                onSimulateStop={handleSimulateStop}
                onResumeWorker={handleResumeWorker}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onOpenAssignModal={() => setAssignModalOpen(true)}
              />
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-5">
              <WorkerMobileSimulator
                workers={workers}
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={setSelectedWorkerId}
                tasks={tasks}
                onToggleShift={handleToggleShift}
                onResumeFromAlert={handleResumeWorker}
                onCollectPayment={handleCollectPayment}
                onSubmitFieldEnquiry={handleSubmitFieldEnquiry}
              />
            </div>
          </div>
        )}
      </main>

      <AssignTaskModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        workers={workers}
        defaultWorkerId={selectedWorkerId}
        onAssignTask={handleAssignTask}
      />
    </div>
  );
}
