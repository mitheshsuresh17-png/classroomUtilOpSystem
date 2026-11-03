import React, { useState } from 'react';
import { Clock, Layers, Sparkles } from 'lucide-react';
import { TimeSlot } from '../lib/api';

export type { TimeSlot };

interface TimeSlotGridProps {
    mode: 'select' | 'view';
    slots: TimeSlot[];
    bookedSlotIds: string[]; // IDs of slots that are already occupied
    selectedSlotId?: string; // Currently selected slot ID (for single-slot select mode)
    selectedSlotName?: string; // Currently selected slot group name (e.g. 'A', 'B')
    selectionMode?: 'single' | 'clubbed'; // 'single' period vs 'clubbed' group (e.g. all 'A' slots)
    onSelectSlot?: (slotId: string, slot: TimeSlot) => void;
    onSelectSlotGroup?: (slotName: string, slotsInGroup: TimeSlot[]) => void;
}

const HOUR_LABELS: Record<number, { label: string; time: string }> = {
    1: { label: 'H1', time: '08:00' },
    2: { label: 'H2', time: '08:50' },
    3: { label: 'H3', time: '09:50' },
    4: { label: 'H4', time: '10:40' },
    5: { label: 'H5', time: '11:40' },
    6: { label: 'H6', time: '12:30' },
    7: { label: 'H7', time: '13:30' },
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
    bookedSlotIds,
    selectedSlotId,
    selectedSlotName,
    selectionMode = 'single',
    onSelectSlot,
    onSelectSlotGroup,
}: TimeSlotGridProps) {
    const [hoveredSlotName, setHoveredSlotName] = useState<string | null>(null);

    const days = ['1', '2', '3', '4', '5'];
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Build a 2D lookup map: [day][hour] => TimeSlot
    const slotMap = new Map<string, TimeSlot>();
    slots.forEach(slot => {
        const key = `${slot.day_of_week}_${slot.hour_order}`;
        slotMap.set(key, slot);
    });

    const formatTime = (timeStr?: string) => (timeStr ? timeStr.substring(0, 5) : '');

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Header / Legend Bar */}
            <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-semibold text-sm text-white flex items-center gap-2">
                            {mode === 'select'
                                ? selectionMode === 'clubbed'
                                    ? 'Select Theory Slot Group (A–G)'
                                    : 'Select Period Slot'
                                : 'Master Timetable Grid (50 Slots)'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                            5 Days × 10 Periods (08:00 – 16:50) • Hours 1–10
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
                        <span className="text-slate-300 text-[11px]">Theory (A–G)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                        <span className="text-slate-300 text-[11px]">Lab (P1–P10)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700 opacity-60" />
                        <span className="text-slate-400 text-[11px]">Booked</span>
                    </div>
                    {mode === 'select' && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-indigo-600 shadow-sm shadow-indigo-500/50" />
                            <span className="text-indigo-300 text-[11px] font-semibold">Selected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Container */}
            <div className="p-4 overflow-x-auto">
                <div className="min-w-[840px]">
                    {/* Column Headers (Hours 1 - 10) */}
                    <div className="grid grid-cols-[56px_repeat(10,1fr)] gap-1.5 mb-2 text-center">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center uppercase tracking-wider">
                            Day
                        </div>
                        {hours.map(hour => {
                            const info = HOUR_LABELS[hour];
                            return (
                                <div
                                    key={hour}
                                    className="py-1 px-1 bg-slate-950/40 border border-slate-800/60 rounded-lg text-slate-400"
                                >
                                    <div className="text-[11px] font-bold text-slate-300">{info.label}</div>
                                    <div className="text-[9px] text-slate-500 font-mono">{info.time}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Day Rows */}
                    <div className="space-y-1.5">
                        {days.map(day => (
                            <div key={day} className="grid grid-cols-[56px_repeat(10,1fr)] gap-1.5">
                                {/* Day Tag */}
                                <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300">
                                    <span className="text-xs font-bold text-white">{DAY_NAMES[day]}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">D{day}</span>
                                </div>

                                {/* 10 Slot Cells */}
                                {hours.map(hour => {
                                    const slot = slotMap.get(`${day}_${hour}`);
                                    if (!slot) {
                                        return (
                                            <div
                                                key={hour}
                                                className="h-14 rounded-xl border border-dashed border-slate-800/40 bg-slate-950/20"
                                            />
                                        );
                                    }

                                    const slotIdStr = slot.slot_id.toString();
                                    const isBooked = bookedSlotIds.includes(slotIdStr);
                                    const isTheory = slot.slot_type === 'Theory';
                                    const isGroupHighlighted =
                                        hoveredSlotName && hoveredSlotName === slot.slot_name;
                                    const isSelectedGroup =
                                        selectedSlotName && selectedSlotName === slot.slot_name;
                                    const isSelectedSingle = selectedSlotId === slotIdStr;
                                    const isSelected = isSelectedSingle || isSelectedGroup;

                                    let cellStyles =
                                        'h-14 rounded-xl p-1 flex flex-col items-center justify-center transition-all duration-150 relative group ';

                                    if (isBooked) {
                                        cellStyles +=
                                            'bg-slate-950/60 border border-slate-800/80 text-slate-600 cursor-not-allowed opacity-50 ';
                                    } else if (isSelected) {
                                        cellStyles +=
                                            'bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-[1.03] z-10 font-bold ';
                                    } else if (isGroupHighlighted) {
                                        cellStyles += isTheory
                                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 scale-[1.02] z-10 cursor-pointer '
                                            : 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20 scale-[1.02] z-10 cursor-pointer ';
                                    } else {
                                        cellStyles += isTheory
                                            ? 'bg-amber-950/20 border border-amber-500/25 text-amber-300 hover:border-amber-400/80 hover:bg-amber-500/20 cursor-pointer '
                                            : 'bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 hover:border-emerald-400/80 hover:bg-emerald-500/20 cursor-pointer ';
                                    }

                                    const handleClick = () => {
                                        if (mode === 'view' || isBooked) return;
                                        // If it's a Theory slot (A-G) and onSelectSlotGroup exists, always select the whole clubbed group
                                        if (slot.slot_type === 'Theory' && onSelectSlotGroup) {
                                            const groupSlots = slots.filter(s => s.slot_name === slot.slot_name);
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
                                            <span className="text-[9px] font-mono opacity-80">
                                                {formatTime(slot.start_time)}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-950 text-white text-[10px] rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 transition-opacity">
                                                <div className="font-bold flex items-center gap-1">
                                                    <span>Slot {slot.slot_name}</span>
                                                    <span className="text-slate-400">({slot.slot_type})</span>
                                                </div>
                                                <div className="text-slate-400">
                                                    Day {slot.day_of_week} • Period {slot.hour_order} ({formatTime(slot.start_time)}–{formatTime(slot.end_time)})
                                                </div>
                                                {isBooked ? (
                                                    <div className="text-red-400 font-semibold mt-0.5">Occupied / Booked</div>
                                                ) : (
                                                    <div className="text-emerald-400 font-medium mt-0.5">
                                                        {slot.slot_type === 'Theory'
                                                            ? `Click to select ALL '${slot.slot_name}' slots in week (${slots.filter(s => s.slot_name === slot.slot_name).length} periods)`
                                                            : 'Click to select slot'}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom info helper */}
            <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hover over any slot to highlight all recurring periods across the week with the same slot code.</span>
                </div>
                {hoveredSlotName && (
                    <span className="text-indigo-300 font-semibold">
                        Highlighted Group: <span className="font-mono">{hoveredSlotName}</span> ({slots.filter(s => s.slot_name === hoveredSlotName).length} periods)
                    </span>
                )}
            </div>
        </div>
    );
}
