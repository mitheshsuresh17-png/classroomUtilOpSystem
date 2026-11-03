import React, { useState } from 'react';
import { Clock, Sparkles, AlertCircle } from 'lucide-react';
import { TimeSlot } from '../lib/api';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

export type { TimeSlot };

export interface SlotConflictInfo {
  isOccupied: boolean;
  isRoomConflict: boolean;
  isBatchConflict: boolean;
  isFacultyConflict: boolean;
  details: string[];
}

interface TimeSlotGridProps {
  mode: 'select' | 'view';
  slots: TimeSlot[];
  bookedSlotIds?: string[]; // IDs of slots that are already occupied
  slotConflicts?: Record<string, SlotConflictInfo>; // Granular conflict tracking (room/batch/faculty)
  selectedSlotId?: string; // Currently selected slot ID (for single-slot select mode)
  selectedSlotName?: string; // Currently selected slot group name (e.g. 'A', 'B')
  selectionMode?: 'single' | 'clubbed';
  onSelectSlot?: (slotId: string, slot: TimeSlot) => void;
  onSelectSlotGroup?: (slotName: string, slotsInGroup: TimeSlot[]) => void;
}

const HOUR_LABELS: Record<number, { label: string; time: string }> = {
  1: { label: 'H1', time: '08:00' },
  2: { label: 'H2', time: '08:50' },
  3: { label: 'H3', time: '09:45' },
  4: { label: 'H4', time: '10:40' },
  5: { label: 'H5', time: '11:35' },
  6: { label: 'H6', time: '12:30' },
  7: { label: 'H7', time: '13:25' },
  8: { label: 'H8', time: '14:20' },
  9: { label: 'H9', time: '15:10' },
  10: { label: 'H10', time: '16:00' },
};

const DAY_NAMES: Record<string, string> = {
  '1': 'Mon',
  '2': 'Tue',
  '3': 'Wed',
  '4': 'Thu',
  '5': 'Fri',
};

export default function TimeSlotGrid({
  mode,
  slots,
  bookedSlotIds = [],
  slotConflicts,
  selectedSlotId,
  selectedSlotName,
  selectionMode = 'single',
  onSelectSlot,
  onSelectSlotGroup,
}: TimeSlotGridProps) {
  const [hoveredSlotName, setHoveredSlotName] = useState<string | null>(null);

  const days = ['1', '2', '3', '4', '5'];
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 2D lookup map: [day][hour] => TimeSlot
  const slotMap = new Map<string, TimeSlot>();
  slots.forEach((slot) => {
    slotMap.set(`${slot.day_of_week}_${slot.hour_order}`, slot);
  });

  const formatTime = (timeStr?: string) => (timeStr ? timeStr.substring(0, 5) : '');

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
      {/* Header / Legend Bar */}
      <div className="bg-slate-50/95 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
              {mode === 'select' ? 'Select Time Slot / Theory Group' : 'Master Timetable Grid'}
            </span>
            <p className="text-[11px] text-slate-500">
              5 Days × 10 Periods (08:00 – 16:50) • Hours 1–10
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            <span className="text-slate-600 text-xs">Available Theory (A–G)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-slate-600 text-xs">Available Lab (P1–P50)</span>
          </div>

          {slotConflicts ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-400" />
                <span className="text-rose-700 text-xs font-medium">Room Unavailable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-100 border border-purple-400" />
                <span className="text-purple-700 text-xs font-medium">Batch Conflict</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-200 border border-amber-500" />
                <span className="text-amber-800 text-xs font-medium">Faculty Busy</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 opacity-70" />
              <span className="text-slate-500 text-xs">Booked</span>
            </div>
          )}

          {mode === 'select' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 shadow-xs" />
              <span className="text-blue-700 text-xs font-semibold">Selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="p-4 overflow-x-auto bg-white">
        <div className="min-w-[840px]">
          {/* Column Headers (Hours 1 - 10) */}
          <div className="grid grid-cols-[56px_repeat(10,1fr)] gap-1.5 mb-2 text-center">
            <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center uppercase tracking-wider">
              Day
            </div>
            {hours.map((hour) => {
              const info = HOUR_LABELS[hour];
              return (
                <div
                  key={hour}
                  className="py-1 px-1 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700"
                >
                  <div className="text-[11px] font-bold text-slate-800">{info.label}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{info.time}</div>
                </div>
              );
            })}
          </div>

          {/* Day Rows */}
          <div className="space-y-1.5">
            {days.map((day) => (
              <div key={day} className="grid grid-cols-[56px_repeat(10,1fr)] gap-1.5">
                {/* Day Tag */}
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  <span className="text-xs font-bold text-slate-900">{DAY_NAMES[day]}</span>
                  <span className="text-[9px] text-slate-400 font-mono">D{day}</span>
                </div>

                {/* 10 Slot Cells */}
                {hours.map((hour) => {
                  const slot = slotMap.get(`${day}_${hour}`);
                  if (!slot) {
                    return (
                      <div
                        key={hour}
                        className="h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50/50"
                      />
                    );
                  }

                  const slotIdStr = slot.slot_id.toString();
                  const conflict = slotConflicts?.[slotIdStr];
                  const isBooked = conflict ? conflict.isOccupied : bookedSlotIds.includes(slotIdStr);
                  const isTheory = slot.slot_type === 'Theory';
                  const isGroupHighlighted = hoveredSlotName && hoveredSlotName === slot.slot_name;
                  const isSelectedGroup = selectedSlotName && selectedSlotName === slot.slot_name;
                  const isSelectedSingle = selectedSlotId === slotIdStr;
                  const isSelected = isSelectedSingle || isSelectedGroup;

                  let cellStyles =
                    'h-14 rounded-xl p-1 flex flex-col items-center justify-center transition-all duration-150 relative group ';

                  if (isSelected) {
                    cellStyles +=
                      'bg-blue-600 border border-blue-700 text-white shadow-md shadow-blue-500/25 scale-[1.03] z-20 font-bold ';
                  } else if (isBooked) {
                    if (conflict?.isRoomConflict && !conflict.isBatchConflict && !conflict.isFacultyConflict) {
                      cellStyles +=
                        'bg-rose-50/90 border border-rose-300 text-rose-800 cursor-not-allowed ';
                    } else if (conflict?.isBatchConflict && !conflict.isRoomConflict && !conflict.isFacultyConflict) {
                      cellStyles +=
                        'bg-purple-50/90 border border-purple-300 text-purple-800 cursor-not-allowed ';
                    } else if (conflict?.isFacultyConflict && !conflict.isRoomConflict && !conflict.isBatchConflict) {
                      cellStyles +=
                        'bg-amber-100/90 border border-amber-400 text-amber-900 cursor-not-allowed ';
                    } else {
                      cellStyles +=
                        'bg-red-50 border border-red-300 text-red-800 cursor-not-allowed ';
                    }
                  } else if (isGroupHighlighted) {
                    cellStyles += isTheory
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs scale-[1.02] z-10 cursor-pointer '
                      : 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs scale-[1.02] z-10 cursor-pointer ';
                  } else {
                    cellStyles += isTheory
                      ? 'bg-amber-50/90 border border-amber-200 text-amber-900 hover:border-amber-400 hover:bg-amber-100 cursor-pointer '
                      : 'bg-emerald-50/90 border border-emerald-200 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer ';
                  }

                  const handleClick = () => {
                    if (mode === 'view' || isBooked) return;
                    if (slot.slot_type === 'Theory' && onSelectSlotGroup) {
                      const groupSlots = slots.filter((s) => s.slot_name === slot.slot_name);
                      onSelectSlotGroup(slot.slot_name, groupSlots);
                    } else if (onSelectSlot) {
                      onSelectSlot(slotIdStr, slot);
                    }
                  };

                  return (
                    <button
                      key={hour}
                      type="button"
                      disabled={mode === 'view' || isBooked}
                      onClick={handleClick}
                      onMouseEnter={() => setHoveredSlotName(slot.slot_name)}
                      onMouseLeave={() => setHoveredSlotName(null)}
                      className={cellStyles}
                    >
                      {/* Slot Name */}
                      <span className="text-xs font-black tracking-wide font-mono">
                        {slot.slot_name}
                      </span>
                      {/* Timing */}
                      <span className={cn('text-[9px] font-mono', isSelected ? 'text-blue-100' : 'text-slate-500')}>
                        {formatTime(slot.start_time)}
                      </span>

                      {/* Tooltip: Shown ONLY if slot is occupied / conflicted (No blunt repeated text on free slots) */}
                      {isBooked && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[11px] rounded-lg border border-slate-700 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-normal w-56 z-50 transition-opacity text-left">
                          <div className="font-bold flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1">
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-400 inline" />
                              Occupied / Conflict
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Slot {slot.slot_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mb-1.5">
                            Day {slot.day_of_week} ({DAY_NAMES[slot.day_of_week]}) • {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                          </div>
                          {conflict && conflict.details.length > 0 ? (
                            <ul className="space-y-1 text-[10px]">
                              {conflict.details.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-1 text-slate-200">
                                  <span className="text-rose-400 font-bold shrink-0">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-rose-300 text-[10px]">
                              This venue or slot is already booked for another course.
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom info helper */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Click any Theory slot (A–G) to automatically allocate all linked weekly periods together.</span>
        </div>
        {hoveredSlotName && (
          <Badge variant="theory">
            Group {hoveredSlotName} ({slots.filter((s) => s.slot_name === hoveredSlotName).length} periods)
          </Badge>
        )}
      </div>
    </div>
  );
}
