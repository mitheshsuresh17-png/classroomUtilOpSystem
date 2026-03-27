import React, { useEffect, useState } from 'react';
import { 
    fetchSchedules, fetchCourses, fetchBatches, fetchRooms, 
    fetchTimeSlots, scheduleRoom, fetchEmptySlots, fetchUnscheduledCourses 
} from '../lib/api';
import { Filter, Search, ListTodo, Plus, Calendar } from 'lucide-react';

interface Schedule {
    schedule_id: string;
    course_name: string;
    dept_name: string;
    year_of_study: number;
    section: string;
    room_number: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface Course { course_id: string; course_name: string; course_code: string; }
interface Batch { batch_id: string; year_of_study: number; section: string; student_count: number; }
interface Room { room_id: string; room_number: string; room_type: string; capacity: number; }
interface TimeSlot { slot_id: string; day_of_week: string; start_time: string; end_time: string; }

export default function ScheduleView() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [emptySlotsData, setEmptySlotsData] = useState<Schedule[]>([]);
    const [unscheduledData, setUnscheduledData] = useState<{course_code: string, course_name: string}[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({ course_id: '', batch_id: '', room_id: '', slot_id: '' });

    const [searchCourse, setSearchCourse] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [showEmptySlots, setShowEmptySlots] = useState(false);
    const [showUnscheduled, setShowUnscheduled] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [schedData, cData, bData, rData, sData, eData, uData] = await Promise.all([
                fetchSchedules(), fetchCourses(), fetchBatches(), fetchRooms(), fetchTimeSlots(),
                fetchEmptySlots(), fetchUnscheduledCourses()
            ]);
            setSchedules(schedData);
            setCourses(cData);
            setBatches(bData);
            setRooms(rData);
            setSlots(sData);
            setEmptySlotsData(eData);
            setUnscheduledData(uData);
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
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred during scheduling');
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
            {/* Add New Schedule */}
            <div className="card p-5 animate-fade-up">
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
                        <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" value={form.room_id} onChange={(e) => setForm({...form, room_id: e.target.value})}>
                            <option value="">Select Room</option>
                            {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number} (Cap: {r.capacity})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Time Slot</label>
                        <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" value={form.slot_id} onChange={(e) => setForm({...form, slot_id: e.target.value})}>
                            <option value="">Select Slot</option>
                            {slots.map(s => <option key={s.slot_id} value={s.slot_id}>Day {s.day_of_week} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)})</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4 mt-1">
                        <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
                            <Plus className="w-4 h-4" />
                            Create Allocation
                        </button>
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="card p-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Filter className="text-gray-500 w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-800">Filter Schedules & Analyze Allocations</h3>
                    </div>
                    <button 
                        onClick={() => setShowUnscheduled(!showUnscheduled)}
                        className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${showUnscheduled ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        <ListTodo size={14} /> 
                        {showUnscheduled ? 'Hide Unscheduled' : 'View Unscheduled (LEFT JOIN)'}
                    </button>
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

            {/* Unscheduled Courses Panel */}
            {showUnscheduled && (
                <div className="card border-orange-100 bg-orange-50/30 p-5 animate-fade-up">
                    <h2 className="text-base font-bold mb-3 text-orange-900 flex items-center gap-2">
                        <ListTodo className="text-orange-600 w-4 h-4" />
                        Orphaned Classes
                        <span className="ml-2 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-lg font-mono">LEFT JOIN where IS NULL</span>
                    </h2>
                    <div className="overflow-auto max-h-56 border border-orange-200 rounded-xl">
                        <table className="min-w-full text-sm bg-white">
                            <thead className="bg-orange-50 text-orange-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Course Code</th>
                                    <th className="px-4 py-3 text-left font-semibold text-xs uppercase">Course Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {unscheduledData.length > 0 ? unscheduledData.map((c, i) => (
                                    <tr key={i} className="hover:bg-orange-50/50">
                                        <td className="px-4 py-3 font-medium text-orange-700">{c.course_code}</td>
                                        <td className="px-4 py-3 text-orange-900">{c.course_name}</td>
                                    </tr>
                                )) : <tr><td colSpan={2} className="px-4 py-4 text-center text-orange-500 italic">All courses have been scheduled!</td></tr>}
                            </tbody>
                        </table>
                    </div>
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
                                        Day {s.day_of_week} ({s.start_time.substring(0,5)} — {s.end_time.substring(0,5)})
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
