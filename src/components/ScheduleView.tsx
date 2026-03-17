import React, { useEffect, useState } from 'react';
import { fetchSchedules, fetchCourses, fetchBatches, fetchRooms, fetchTimeSlots, scheduleRoom } from '../lib/api';

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

export default function ScheduleView() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [form, setForm] = useState({
        course_id: '',
        batch_id: '',
        room_id: '',
        slot_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [schedData, cData, bData, rData, sData] = await Promise.all([
                fetchSchedules(), fetchCourses(), fetchBatches(), fetchRooms(), fetchTimeSlots()
            ]);
            setSchedules(schedData);
            setCourses(cData);
            setBatches(bData);
            setRooms(rData);
            setSlots(sData);
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
                            {slots.map(s => <option key={s.slot_id} value={s.slot_id}>{s.day_of_week} {s.start_time}-{s.end_time}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4 mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Create Allocation</button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Master Schedule</h2>
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
                            {schedules.map((s, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.dept_name} - {s.course_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Yr {s.year_of_study} Sec {s.section}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.room_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.day_of_week} ({s.start_time} - {s.end_time})</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
