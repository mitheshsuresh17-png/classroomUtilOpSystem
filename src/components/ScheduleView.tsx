import React, { useEffect, useState } from 'react';
import { 
    fetchSchedules, fetchCourses, fetchBatches, fetchRooms, 
    fetchTimeSlots, scheduleRoom, fetchEmptySlots, fetchUnscheduledCourses 
} from '../lib/api';
import { Filter, Search, ListTodo } from 'lucide-react';

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

// ... (keep required interfaces for Course, Batch, Room, TimeSlot)
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

    // Filter States
    const [searchCourse, setSearchCourse] = useState('');
    const [filterDay, setFilterDay] = useState('');
    
    // SQL Scenario Toggles
    const [showEmptySlots, setShowEmptySlots] = useState(false); // RIGHT JOIN
    const [showUnscheduled, setShowUnscheduled] = useState(false); // LEFT JOIN

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
            loadData(); // Reload table
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred during scheduling');
        }
    };

    // Combine standard schedules with RIGHT JOIN NULL rows if toggled
    const combinedSchedules = showEmptySlots ? [...schedules, ...emptySlotsData] : schedules;

    // Filter combined results
    const filteredSchedules = combinedSchedules.filter(s => {
        const matchesCourse = filterDay === 'Empty' ? true : 
            (s.course_name || '').toLowerCase().includes(searchCourse.toLowerCase()) || 
            (s.dept_name || '').toLowerCase().includes(searchCourse.toLowerCase());
        const matchesDay = filterDay ? s.day_of_week === filterDay : true;
        return matchesCourse && matchesDay;
    });

    if (loading) return <div>Loading schedules...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Schedule</h2>
                {errorMsg && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{errorMsg}</div>}
                {successMsg && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{successMsg}</div>}
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Course</label>
                        <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={form.course_id} onChange={(e) => setForm({...form, course_id: e.target.value})}>
                            <option value="">Select Course</option>
                            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Batch</label>
                        <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={form.batch_id} onChange={(e) => setForm({...form, batch_id: e.target.value})}>
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b.batch_id} value={b.batch_id}>Year {b.year_of_study} - {b.section}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Room</label>
                        <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={form.room_id} onChange={(e) => setForm({...form, room_id: e.target.value})}>
                            <option value="">Select Room</option>
                            {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.room_number} (Cap: {r.capacity})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                        <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={form.slot_id} onChange={(e) => setForm({...form, slot_id: e.target.value})}>
                            <option value="">Select Slot</option>
                            {slots.map(s => <option key={s.slot_id} value={s.slot_id}>Day {s.day_of_week} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)})</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4 mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Create Allocation</button>
                    </div>
                </form>
            </div>

            {/* Native Filters UI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-500 w-5 h-5" />
                        <h3 className="font-semibold text-gray-800">Filter Schedules & Analyze Allocations</h3>
                    </div>
                    <button 
                        onClick={() => setShowUnscheduled(!showUnscheduled)}
                        className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors ${showUnscheduled ? 'bg-orange-100 text-orange-800 border-orange-200 border' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        <ListTodo size={16} /> 
                        {showUnscheduled ? 'Hide Unscheduled Courses' : 'View Unscheduled Courses (LEFT JOIN limit)'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Course or Dept..."
                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={searchCourse}
                            onChange={(e) => setSearchCourse(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    </div>

                    {/* Advanced SQL Toggle (RIGHT JOIN) */}
                    <div className="lg:col-span-2 flex items-center bg-blue-50 border border-blue-100 px-4 py-2 rounded-md">
                        <label className="flex items-center cursor-pointer w-full justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Include Empty Time Slots</span>
                                <span className="text-xs text-blue-600">Uses RIGHT JOIN to inject NULL schedule rows</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={showEmptySlots}
                                    onChange={(e) => setShowEmptySlots(e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${showEmptySlots ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showEmptySlots ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* LEFT JOIN Scenario UI View */}
            {showUnscheduled && (
                <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-100 p-6">
                    <h2 className="text-lg font-bold mb-4 text-orange-900 flex items-center gap-2">
                        <ListTodo className="text-orange-600" />
                        Orphaned Classes Analytical View <span className="ml-2 bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-mono">LEFT JOIN where IS NULL</span>
                    </h2>
                    <div className="overflow-auto max-h-64 border border-orange-200 rounded">
                        <table className="min-w-full text-sm bg-white">
                            <thead className="bg-orange-100 text-orange-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Course Code</th>
                                    <th className="px-4 py-3 text-left font-semibold">Course Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {unscheduledData.length > 0 ? unscheduledData.map((c, i) => (
                                    <tr key={i} className="hover:bg-orange-50">
                                        <td className="px-4 py-3 font-medium text-orange-700">{c.course_code}</td>
                                        <td className="px-4 py-3 text-orange-900">{c.course_name}</td>
                                    </tr>
                                )) : <tr><td colSpan={2} className="px-4 py-4 text-center text-orange-600 italic">All courses have been scheduled! Excellent utilization.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Master Schedule</h2>
                    <span className="text-sm text-gray-500">Showing {filteredSchedules.length} periods</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept/Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSchedules.map((s, index) => (
                                <tr key={index} className={`hover:bg-gray-50 ${s.dept_name === 'Empty' ? 'bg-blue-50/30 font-serif italic' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {s.dept_name} - {s.course_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {s.year_of_study ? `Yr ${s.year_of_study} Sec ${s.section}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        {s.room_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        Day {s.day_of_week} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)})
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
