import React, { useEffect, useState } from 'react';
import { 
    fetchSchedules, fetchCourses, fetchBatches, fetchRooms, 
    fetchTimeSlots, scheduleRoom, updateSchedule, fetchEmptySlots,
    deleteSchedule, fetchUnscheduledCourses
} from '../lib/api';
import { Filter, Search, Plus, Calendar, Trash2, Eye, Pencil, X, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import TimeSlotGrid from './TimeSlotGrid';
import { useAuth } from '../contexts/AuthContext';

interface Schedule {
    schedule_id: string;
    course_id?: number | string;
    batch_id?: number | string;
    slot_id?: number | string;
    course_name: string;
    dept_name: string;
    year_of_study: number;
    section: string;
    room_number: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    created_by_name?: string;
    created_by_email?: string;
    updated_at?: string;
}

interface Course { course_id: number | string; course_name: string; course_code: string; }
interface Batch { batch_id: string; year_of_study: number; section: string; student_count: number; }
interface Room { room_number: string; room_type: string; capacity: number; }
interface TimeSlot { slot_id: string; day_of_week: string; start_time: string; end_time: string; }
interface UnscheduledCourse { course_code: string; course_name: string; }

export default function ScheduleView() {
    const { user } = useAuth();
    const isCoordinator = user?.role === 'coordinator';

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [emptySlotsData, setEmptySlotsData] = useState<Schedule[]>([]);
    const [unscheduledCourses, setUnscheduledCourses] = useState<UnscheduledCourse[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({ course_id: '', batch_id: '', room_number: '', slot_id: '' });
    const [showSlotPicker, setShowSlotPicker] = useState(false);

    // Edit Schedule Modal State
    const [editTarget, setEditTarget] = useState<Schedule | null>(null);
    const [editForm, setEditForm] = useState({ course_id: '', batch_id: '', room_number: '', slot_id: '' });
    const [editShowSlotPicker, setEditShowSlotPicker] = useState(false);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const [searchCourse, setSearchCourse] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [showEmptySlots, setShowEmptySlots] = useState(false);

    const getBookedSlotIdsForRoom = (roomNumber: string, excludeScheduleId?: string) => {
        if (!roomNumber) return [];
        const selectedRoom = rooms.find(r => r.room_number === roomNumber);
        if (!selectedRoom) return [];

        const roomSchedules = schedules.filter(s => 
            s.room_number === selectedRoom.room_number && 
            (!excludeScheduleId || s.schedule_id?.toString() !== excludeScheduleId.toString())
        );
        
        const bookedIds = roomSchedules.map(sched => {
            const matchingSlot = slots.find(slot => 
                slot.day_of_week === sched.day_of_week && 
                slot.start_time === sched.start_time
            );
            return matchingSlot ? matchingSlot.slot_id.toString() : null;
        }).filter(Boolean) as string[];

        return bookedIds;
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [schedData, cData, bData, rData, sData, eData, unData] = await Promise.all([
                fetchSchedules(), fetchCourses(), fetchBatches(), fetchRooms(), fetchTimeSlots(),
                fetchEmptySlots(), fetchUnscheduledCourses()
            ]);
            setSchedules(schedData);
            setCourses(cData);
            setBatches(bData);
            setRooms(rData);
            setSlots(sData);
            setEmptySlotsData(eData);
            setUnscheduledCourses(unData || []);
        } catch (error) {
            console.error('Error loading schedule data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await scheduleRoom(form);
            setSuccessMsg('Schedule created successfully!');
            setForm({ course_id: '', batch_id: '', room_number: '', slot_id: '' });
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred during scheduling');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        setEditError('');
        setEditLoading(true);
        try {
            await updateSchedule(editTarget.schedule_id, editForm);
            setEditTarget(null);
            loadData();
        } catch (err: any) {
            setEditError(err.message || 'Failed to update schedule');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await deleteSchedule(id);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete schedule');
        }
    };

    const combinedSchedules = showEmptySlots ? [...schedules, ...emptySlotsData] : schedules;
    const filteredSchedules = combinedSchedules.filter(s => {
        const matchesCourse = filterDay === 'Empty' ? true : 
            (s.course_name || '').toLowerCase().includes(searchCourse.toLowerCase()) || 
            (s.dept_name || '').toLowerCase().includes(searchCourse.toLowerCase());
        const matchesDay = filterDay ? s.day_of_week === filterDay : true;
        return matchesCourse && matchesDay;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-gray-500 font-medium">Loading schedules...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Add New Schedule (Coordinator only) */}
            {isCoordinator ? (
                <div className="card p-5 animate-fade-up relative z-50">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Add New Schedule</h2>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm">
                            {successMsg}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Course</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" value={form.course_id} onChange={(e) => setForm({...form, course_id: e.target.value})}>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Batch</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" value={form.batch_id} onChange={(e) => setForm({...form, batch_id: e.target.value})}>
                                <option value="">Select Batch</option>
                                {batches.map(b => <option key={b.batch_id} value={b.batch_id}>Year {b.year_of_study} - {b.section}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" value={form.room_number} onChange={(e) => setForm({...form, room_number: e.target.value})}>
                                <option value="">Select Room</option>
                                {rooms.map(r => <option key={r.room_number} value={r.room_number}>{r.room_number} (Cap: {r.capacity})</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Time Slot</label>
                            <button 
                                type="button" 
                                onClick={() => setShowSlotPicker(!showSlotPicker)}
                                className="w-full text-left border border-gray-200 bg-white rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            >
                                {form.slot_id ? (() => {
                                    const s = slots.find(slot => slot.slot_id.toString() === form.slot_id);
                                    return s ? `Day ${s.day_of_week} (${s.start_time.substring(0,5)})` : 'Select Slot';
                                })() : 'Select Slot'}
                            </button>

                            {showSlotPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSlotPicker(false)}></div>
                                    <div className="absolute z-50 top-full lg:-right-32 mt-2 w-max max-w-[90vw] shadow-2xl rounded-xl animate-fade-up">
                                        <TimeSlotGrid 
                                            mode="select" 
                                            slots={slots} 
                                            bookedSlotIds={getBookedSlotIdsForRoom(form.room_number)} 
                                            selectedSlotId={form.slot_id}
                                            onSelectSlot={(slotId) => {
                                                setForm({...form, slot_id: slotId});
                                                setShowSlotPicker(false);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="md:col-span-4 mt-1">
                            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
                                <Plus className="w-4 h-4" />
                                Create Allocation
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 text-slate-700 text-xs font-medium">
                    <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                    Viewer Mode — Schedule allocations are read-only. Allocation changes require Department Coordinator privileges.
                </div>
            )}

            {/* Filters */}
            <div className="card p-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Filter className="text-gray-500 w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-800">Filter Schedules & Analyze Allocations</h3>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Course or Dept..."
                            className="pl-10 w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            value={searchCourse}
                            onChange={(e) => setSearchCourse(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                    >
                        <option value="">All Days</option>
                        <option value="1">Day 1 (Monday)</option>
                        <option value="2">Day 2 (Tuesday)</option>
                        <option value="3">Day 3 (Wednesday)</option>
                        <option value="4">Day 4 (Thursday)</option>
                        <option value="5">Day 5 (Friday)</option>
                    </select>

                    <div className="lg:col-span-2 flex items-center bg-blue-50/80 border border-blue-100 px-4 py-2.5 rounded-xl">
                        <label className="flex items-center cursor-pointer w-full justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Include Empty Time Slots</span>
                                <span className="text-xs text-blue-500">Uses RIGHT JOIN to inject NULL schedule rows</span>
                            </div>
                            <div className="relative ml-3">
                                <input type="checkbox" className="sr-only" checked={showEmptySlots} onChange={(e) => setShowEmptySlots(e.target.checked)} />
                                <div className={`block w-11 h-6 rounded-full transition-colors ${showEmptySlots ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showEmptySlots ? 'translate-x-5' : ''}`} />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Unscheduled Courses Banner / Card */}
            {unscheduledCourses.length > 0 ? (
                <div className="card p-5 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border border-amber-200/80 animate-fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    Unscheduled Courses
                                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 text-xs font-black">
                                        {unscheduledCourses.length} Pending
                                    </span>
                                </h3>
                                <p className="text-xs text-amber-700/80">These courses have zero scheduled time slots in the master timetable</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {unscheduledCourses.map((c, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (isCoordinator) {
                                        const matchingCourse = courses.find(course => course.course_code === c.course_code || course.course_name === c.course_name);
                                        if (matchingCourse) {
                                            setForm(prev => ({ ...prev, course_id: matchingCourse.course_id.toString() }));
                                        }
                                    }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-white/80 text-xs font-semibold text-amber-900 shadow-sm transition-all ${
                                    isCoordinator ? 'hover:bg-amber-100/80 hover:border-amber-300 cursor-pointer active:scale-95' : 'cursor-default'
                                }`}
                                title={isCoordinator ? "Click to pre-fill in schedule form" : ""}
                            >
                                <span className="font-bold text-amber-700">{c.course_code}</span>
                                <span>—</span>
                                <span>{c.course_name}</span>
                                {isCoordinator && <Plus className="w-3.5 h-3.5 text-amber-600 ml-0.5" />}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs font-medium text-emerald-800 animate-fade-up">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All academic courses are currently allocated to active room time slots.</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] uppercase tracking-wider">
                        100% Scheduled
                    </span>
                </div>
            )}

            {/* Schedule Table */}
            <div className="card animate-fade-up" style={{ animationDelay: '160ms' }}>
                <div className="card-header flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-800">Master Schedule</h2>
                    </div>
                    <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-lg">{filteredSchedules.length} periods</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Dept/Course</th>
                                <th>Batch</th>
                                <th>Room</th>
                                <th>Time</th>
                                <th>Allocated By</th>
                                {isCoordinator && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map((s, index) => (
                                <tr key={index} className={s.dept_name === 'Empty' ? '!bg-blue-50/40 italic opacity-70' : ''}>
                                    <td className="text-gray-900 font-medium">
                                        {s.dept_name} — {s.course_name}
                                    </td>
                                    <td className="text-gray-600">
                                        {s.year_of_study ? `Yr ${s.year_of_study} Sec ${s.section}` : '—'}
                                    </td>
                                    <td>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                                            {s.room_number}
                                        </span>
                                    </td>
                                    <td className="text-gray-600">
                                        Day {s.day_of_week || '?'} ({s.start_time ? s.start_time.substring(0,5) : '--:--'} — {s.end_time ? s.end_time.substring(0,5) : '--:--'})
                                    </td>
                                    <td className="text-gray-500 text-xs">
                                        {s.created_by_name ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                                                {s.created_by_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    {isCoordinator && (
                                        <td className="text-right">
                                            {s.schedule_id && s.dept_name !== 'Empty' && (
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            setEditTarget(s);
                                                            setEditForm({
                                                                course_id: s.course_id?.toString() || (courses.find(c => c.course_name === s.course_name)?.course_id.toString() || ''),
                                                                batch_id: s.batch_id?.toString() || (batches.find(b => b.year_of_study === s.year_of_study && b.section === s.section)?.batch_id.toString() || ''),
                                                                room_number: s.room_number || '',
                                                                slot_id: s.slot_id?.toString() || (slots.find(slot => slot.day_of_week === s.day_of_week && slot.start_time === s.start_time)?.slot_id.toString() || '')
                                                            });
                                                            setEditError('');
                                                        }}
                                                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                        title="Edit Allocation"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(s.schedule_id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Schedule"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Schedule Modal */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-visible">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Edit Schedule #{editTarget.schedule_id}</h3>
                                    <p className="text-xs text-slate-500">Reassign course, batch, room, or time slot</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditTarget(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {editError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{editError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Course</label>
                                    <select
                                        required
                                        value={editForm.course_id}
                                        onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Batch</label>
                                    <select
                                        required
                                        value={editForm.batch_id}
                                        onChange={(e) => setEditForm({ ...editForm, batch_id: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        <option value="">Select Batch</option>
                                        {batches.map(b => <option key={b.batch_id} value={b.batch_id}>Year {b.year_of_study} - {b.section} ({b.student_count} students)</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room</label>
                                    <select
                                        required
                                        value={editForm.room_number}
                                        onChange={(e) => setEditForm({ ...editForm, room_number: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        <option value="">Select Room</option>
                                        {rooms.map(r => <option key={r.room_number} value={r.room_number}>{r.room_number} ({r.room_type}, Cap: {r.capacity})</option>)}
                                    </select>
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Time Slot</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditShowSlotPicker(!editShowSlotPicker)}
                                        className="w-full text-left border border-gray-200 bg-white rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        {editForm.slot_id ? (() => {
                                            const s = slots.find(slot => slot.slot_id.toString() === editForm.slot_id);
                                            return s ? `Day ${s.day_of_week} (${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)})` : 'Select Slot';
                                        })() : 'Select Slot'}
                                    </button>

                                    {editShowSlotPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setEditShowSlotPicker(false)}></div>
                                            <div className="absolute z-50 top-full lg:-right-32 mt-2 w-max max-w-[90vw] shadow-2xl rounded-xl animate-fade-up">
                                                <TimeSlotGrid 
                                                    mode="select" 
                                                    slots={slots} 
                                                    bookedSlotIds={getBookedSlotIdsForRoom(editForm.room_number, editTarget.schedule_id)} 
                                                    selectedSlotId={editForm.slot_id}
                                                    onSelectSlot={(slotId) => {
                                                        setEditForm({ ...editForm, slot_id: slotId });
                                                        setEditShowSlotPicker(false);
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 pt-1">
                                Note: Database triggers validate that room capacity meets batch size and prevents time slot double-booking.
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditTarget(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


