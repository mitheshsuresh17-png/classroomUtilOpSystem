import React from 'react';
import { Clock } from 'lucide-react';

export interface TimeSlot {
    slot_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface TimeSlotGridProps {
    mode: 'select' | 'view';
    slots: TimeSlot[];
    bookedSlotIds: string[]; // IDs of slots that are already occupied
    selectedSlotId?: string; // Currently selected slot ID (for select mode)
    onSelectSlot?: (slotId: string) => void;
}

export default function TimeSlotGrid({ mode, slots, bookedSlotIds, selectedSlotId, onSelectSlot }: TimeSlotGridProps) {
    // Group slots by day (1 to 5)
    const days = ['1', '2', '3', '4', '5'];
    
    // Create a map for quick lookup
    const slotsByDay: Record<string, TimeSlot[]> = {};
    days.forEach(day => {
        slotsByDay[day] = slots
            .filter(s => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    const formatTime = (timeStr: string) => timeStr.substring(0, 5);

    return (
        <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-sm text-gray-800">
                        {mode === 'select' ? 'Select Time Slot' : 'Room Availability Grid'}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-white border border-gray-300"></div>
                        <span className="text-gray-500">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${mode === 'select' ? 'bg-gray-200 border border-gray-300' : 'bg-blue-100 border border-blue-300'}`}></div>
                        <span className="text-gray-500">{mode === 'select' ? 'Booked (Unavailable)' : 'Occupied'}</span>
                    </div>
                    {mode === 'select' && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-blue-600"></div>
                            <span className="text-gray-500">Selected</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-[auto_1fr] gap-4">
                        {days.map(day => {
                            const daySlots = slotsByDay[day] || [];
                            if (daySlots.length === 0) return null; // Skip days with no slots to render safely
                            
                            return (
                                <React.Fragment key={day}>
                                    <div className="flex items-center justify-center w-12 h-10 bg-gray-100 rounded-lg font-bold text-gray-600 text-sm">
                                        D{day}
                                    </div>
                                    <div className="flex gap-2">
                                        {daySlots.map(slot => {
                                            const isBooked = bookedSlotIds.includes(slot.slot_id.toString());
                                            const isSelected = selectedSlotId === slot.slot_id.toString();
                                            
                                            let cellClass = "flex-1 min-w-[60px] h-10 rounded-lg flex flex-col items-center justify-center text-[10px] border transition-all duration-200 group relative ";
                                            
                                            if (mode === 'select') {
                                                if (isBooked) {
                                                    cellClass += "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60";
                                                } else if (isSelected) {
                                                    cellClass += "bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/30 scale-105 z-10";
                                                } else {
                                                    cellClass += "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer";
                                                }
                                            } else {
                                                // View mode
                                                if (isBooked) {
                                                    cellClass += "bg-blue-100 border-blue-300 text-blue-700 font-semibold";
                                                } else {
                                                    cellClass += "bg-white border-gray-100 text-gray-300";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={slot.slot_id}
                                                    type="button"
                                                    disabled={mode === 'view' || isBooked}
                                                    onClick={() => mode === 'select' && !isBooked && onSelectSlot && onSelectSlot(slot.slot_id.toString())}
                                                    className={cellClass}
                                                >
                                                    <span className="font-semibold">{formatTime(slot.start_time)}</span>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                        {isBooked ? ' (Booked)' : ''}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
