import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Radio } from 'lucide-react';
import { formatDuration, formatINR } from '../utils/alarmAudio.ts';
import type { FieldTask, FieldWorker } from '../types.ts';

interface LiveFieldMapProps {
  workers: FieldWorker[];
  tasks: FieldTask[];
  selectedWorkerId: string;
  onSelectWorker: (workerId: string) => void;
}

const ZONE_LABELS = [
  { name: 'MALLESWARAM', x: 240, y: 95 },
  { name: 'MG ROAD', x: 520, y: 245 },
  { name: 'INDIRANAGAR', x: 750, y: 145 },
  { name: 'WHITEFIELD', x: 895, y: 130 },
  { name: 'JAYANAGAR', x: 345, y: 410 },
  { name: 'KORAMANGALA', x: 640, y: 395 },
  { name: 'HSR LAYOUT', x: 710, y: 580 },
];

export const LiveFieldMap: React.FC<LiveFieldMapProps> = ({
  workers,
  tasks,
  selectedWorkerId,
  onSelectWorker,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragging({
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    setPan({
      x: Math.max(-220, Math.min(220, dragging.origX + dx)),
      y: Math.max(-160, Math.min(160, dragging.origY + dy)),
    });
  };

  const handleMouseUp = () => setDragging(null);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const getStatusColor = (worker: FieldWorker) => {
    if (!worker.onShift || worker.status === 'off_shift') {
      return { fill: '#64748B', ring: '#CBD5E1', label: 'Off Shift' };
    }
    if (worker.status === 'stationary_alert') {
      return { fill: '#DC2626', ring: '#FCA5A5', label: 'Stationary Alert' };
    }
    if (worker.status === 'at_customer') {
      return { fill: '#D97706', ring: '#FDE68A', label: 'At Customer' };
    }
    return { fill: '#16A34A', ring: '#86EFAC', label: 'Moving' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      {/* Map Header & Legend */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">
            Live Bengaluru Field Tracker
          </h2>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Moving
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
            At Customer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" aria-hidden="true" />
            Stationary Alert
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 rotate-45 inline-block" aria-hidden="true" />
            Pending Task
          </span>
        </div>
      </div>

      {/* Interactive SVG Map Canvas */}
      <div className="relative w-full h-[430px] lg:h-[470px] bg-[#F1F5F9] overflow-hidden select-none">
        {/* Map Zoom & Reset Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.2).toFixed(1))))}
            aria-label="Zoom in map"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
            aria-label="Zoom out map"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Reset map view"
            className="w-8 h-8 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <svg
          viewBox="0 0 1000 620"
          className={`w-full h-full ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <pattern id="cityGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <g
            transform={`translate(${500 + pan.x}, ${310 + pan.y}) scale(${zoom}) translate(-500, -310)`}
          >
            {/* Base Urban Grid */}
            <rect x="0" y="0" width="1000" height="620" fill="#F8FAFC" />
            <rect x="0" y="0" width="1000" height="620" fill="url(#cityGrid)" />

            {/* Subtle Parks / Lakes */}
            <ellipse cx="485" cy="315" rx="46" ry="30" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="1" />
            <ellipse cx="675" cy="345" rx="34" ry="22" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="1" />
            <ellipse cx="385" cy="370" rx="28" ry="20" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="1" />

            {/* Major Arterial Corridors */}
            <path
              d="M 110 155 Q 360 220 525 280 T 950 220"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 110 155 Q 360 220 525 280 T 950 220"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M 240 60 Q 340 270 365 460 T 720 580"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 240 60 Q 340 270 365 460 T 720 580"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M 525 80 L 545 310 L 645 455 L 895 540"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 525 80 L 545 310 L 645 455 L 895 540"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Outer Ring Road loop */}
            <path
              d="M 180 120 C 420 55, 760 85, 920 215 C 960 360, 860 560, 620 570 C 370 575, 190 520, 165 340 C 150 230, 155 150, 180 120 Z"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />

            {/* Neighborhood Zone Labels */}
            {ZONE_LABELS.map((z) => (
              <text
                key={z.name}
                x={z.x}
                y={z.y}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-semibold tracking-wider pointer-events-none"
              >
                {z.name}
              </text>
            ))}

            {/* Worker Route Polylines */}
            {workers.map((w) => {
              const pointsStr = w.routePoints.map((p) => `${p.x},${p.y}`).join(' ');
              const isSelected = w.id === selectedWorkerId;
              return (
                <polygon
                  key={`route-${w.id}`}
                  points={pointsStr}
                  fill="none"
                  stroke={isSelected ? '#4F46E5' : '#94A3B8'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray="6 5"
                  opacity={isSelected ? 0.85 : 0.45}
                />
              );
            })}

            {/* Pending Customer Task / Enquiry Pins */}
            {pendingTasks.map((task) => (
              <g
                key={task.id}
                transform={`translate(${task.mapX}, ${task.mapY})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWorker(task.workerId);
                }}
              >
                <rect
                  x="-5"
                  y="-5"
                  width="10"
                  height="10"
                  rx="2"
                  transform="rotate(45)"
                  fill={task.type === 'new_enquiry' ? '#0EA5E9' : '#4F46E5'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <title>
                  {task.customerName} ({task.chitGroupId}) · {formatINR(task.amountDue)}
                </title>
              </g>
            ))}

            {/* 5 Live Field Worker Markers */}
            {workers.map((worker) => {
              const colors = getStatusColor(worker);
              const totalCollected = worker.cashCollected + worker.upiCollected;
              const isSelected = worker.id === selectedWorkerId;
              const isAlert = worker.status === 'stationary_alert';

              return (
                <g
                  key={worker.id}
                  transform={`translate(${worker.mapX}, ${worker.mapY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWorker(worker.id);
                  }}
                  className="cursor-pointer"
                >
                  {/* Pulsing Alert Halo when Stationary Alert triggers */}
                  {isAlert && (
                    <>
                      <circle r="24" fill="#EF4444" opacity="0.22">
                        <animate
                          attributeName="r"
                          values="14;30;14"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.45;0.05;0.45"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        r="16"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    </>
                  )}

                  {/* Selected Highlight Ring */}
                  {isSelected && !isAlert && (
                    <circle
                      r="17"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Worker Status Dot */}
                  <circle
                    r="10"
                    fill={colors.fill}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />

                  {/* Compact Label Card above Marker: Worker Name + ₹ Collected */}
                  <g transform="translate(0, -18)">
                    <rect
                      x="-64"
                      y="-24"
                      width="128"
                      height="24"
                      rx="6"
                      fill={isAlert ? '#991B1B' : isSelected ? '#0F172A' : '#FFFFFF'}
                      stroke={isAlert ? '#EF4444' : isSelected ? '#0F172A' : '#CBD5E1'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-9"
                      textAnchor="middle"
                      className={`text-[10px] font-semibold ${
                        isAlert || isSelected ? 'fill-white' : 'fill-slate-900'
                      }`}
                    >
                      {worker.name.split(' ')[0]} · {formatINR(totalCollected)}
                    </text>
                  </g>

                  {/* Idle Timer Sub-label if stationary */}
                  {worker.idleSeconds >= 5 && worker.onShift && (
                    <g transform="translate(0, 22)">
                      <rect
                        x="-28"
                        y="-9"
                        width="56"
                        height="15"
                        rx="4"
                        fill={isAlert ? '#DC2626' : '#FEF3C7'}
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-semibold ${
                          isAlert ? 'fill-white' : 'fill-amber-900'
                        }`}
                      >
                        {formatDuration(worker.idleSeconds)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Bottom-Left Selected Worker Coordinates Readout */}
        {(() => {
          const w = workers.find((item) => item.id === selectedWorkerId) ?? workers[0];
          if (!w) return null;
          return (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-2 shadow-xs text-xs flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-900">{w.name}</span>
              <span className="text-slate-500">{w.currentLocationLabel}</span>
              <span className="font-mono tabular-nums text-slate-500">
                {w.lat.toFixed(4)}, {w.lng.toFixed(4)}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
