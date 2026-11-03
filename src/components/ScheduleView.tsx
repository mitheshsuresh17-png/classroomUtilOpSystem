import React, { useEffect, useState } from 'react';
import { 
    fetchSchedules, fetchCourses, fetchBatches, fetchRooms, 
    fetchTimeSlots, scheduleRoom, updateSchedule, fetchEmptySlots,
    deleteSchedule, fetchUnscheduledCourses, fetchFaculty, scheduleClubbed,
    Faculty, TimeSlot
} from '../lib/api';
import { 
    Filter, Search, Plus, Calendar, Trash2, Eye, Pencil,
    AlertCircle, BookOpen, CheckCircle2, GraduationCap, Layers, UserCheck
} from 'lucide-react';
import TimeSlotGrid, { SlotConflictInfo } from './TimeSlotGrid';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

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
    faculty_id?: number | string | null;
    faculty_name?: string | null;
    designation?: string | null;
    slot_name?: string | null;
    slot_type?: 'Theory' | 'Lab' | string | null;
    hour_order?: number | null;
}

interface Course { 
    course_id: number | string; 
    course_name: string; 
    course_code: string; 
    dept_id?: number;
    dept_name?: string;
}
interface Batch { batch_id: string; year_of_study: number; section: string; student_count: number; }
interface Room { room_number: string; room_type: string; capacity: number; }
interface UnscheduledCourse { course_code: string; course_name: string; }

export default function ScheduleView() {
    const { user } = useAuth();
    const isCoordinator = user?.role === 'coordinator';

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [emptySlotsData, setEmptySlotsData] = useState<Schedule[]>([]);
    const [unscheduledCourses, setUnscheduledCourses] = useState<UnscheduledCourse[]>([]);
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [allocationMode, setAllocationMode] = useState<'single' | 'clubbed'>('single');

    const [form, setForm] = useState({ 
        course_id: '', 
        batch_id: '', 
        room_number: '', 
        slot_id: '', 
        slot_name: '',
        faculty_id: '' 
    });
    const [showSlotPicker, setShowSlotPicker] = useState(false);

    // Edit Schedule Modal State
    const [editTarget, setEditTarget] = useState<Schedule | null>(null);
    const [editForm, setEditForm] = useState({ 
        course_id: '', 
        batch_id: '', 
        room_number: '', 
        slot_id: '',
        faculty_id: ''
    });
    const [editShowSlotPicker, setEditShowSlotPicker] = useState(false);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Filters
    const [searchCourse, setSearchCourse] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [filterFaculty, setFilterFaculty] = useState('');
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

    const computeSlotConflicts = (
        roomNumber: string,
        batchId: string,
        facultyId: string,
        excludeScheduleId?: string
    ): Record<string, SlotConflictInfo> => {
        const result: Record<string, SlotConflictInfo> = {};
        
        slots.forEach(slot => {
            const slotIdStr = slot.slot_id.toString();
            const details: string[] = [];
            let isRoomConflict = false;
            let isBatchConflict = false;
            let isFacultyConflict = false;

            const schedulesInSlot = schedules.filter(s => {
                if (excludeScheduleId && s.schedule_id?.toString() === excludeScheduleId.toString()) {
                    return false;
                }
                return (
                    s.slot_id?.toString() === slotIdStr ||
                    (s.day_of_week === slot.day_of_week && s.start_time === slot.start_time)
                );
            });

            if (roomNumber) {
                const roomSched = schedulesInSlot.find(s => s.room_number === roomNumber);
                if (roomSched) {
                    isRoomConflict = true;
                    details.push(`Room ${roomNumber} unavailable: ${roomSched.course_code || roomSched.course_name} (${roomSched.year_of_study ? `Batch ${roomSched.year_of_study}-${roomSched.section}` : `Batch #${roomSched.batch_id}`})`);
                }
            }

            if (batchId) {
                const batchSched = schedulesInSlot.find(s => s.batch_id?.toString() === batchId.toString());
                if (batchSched) {
                    isBatchConflict = true;
                    details.push(`Batch already has class: ${batchSched.course_code || batchSched.course_name} in Room ${batchSched.room_number}`);
                }
            }

            if (facultyId) {
                const facSched = schedulesInSlot.find(s => s.faculty_id?.toString() === facultyId.toString());
                if (facSched) {
                    isFacultyConflict = true;
                    details.push(`Faculty busy: Teaching ${facSched.course_code || facSched.course_name} in Room ${facSched.room_number}`);
                }
            }

            const isOccupied = isRoomConflict || isBatchConflict || isFacultyConflict;
            result[slotIdStr] = {
                isOccupied,
                isRoomConflict,
                isBatchConflict,
                isFacultyConflict,
                details
            };
        });

        return result;
    };

    // Find if a teacher is already locked in for this (course_id, batch_id)
    const existingFacultyForCourseBatch = (() => {
        if (!form.course_id || !form.batch_id) return null;
        const match = schedules.find(s => 
            s.course_id?.toString() === form.course_id.toString() &&
            s.batch_id?.toString() === form.batch_id.toString() &&
            s.faculty_id
        );
        return match ? { id: match.faculty_id, name: match.faculty_name } : null;
    })();

    // Auto-lock faculty if already assigned
    useEffect(() => {
        if (existingFacultyForCourseBatch && existingFacultyForCourseBatch.id) {
            setForm(prev => ({ ...prev, faculty_id: existingFacultyForCourseBatch.id!.toString() }));
        }
    }, [form.course_id, form.batch_id]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [schedData, cData, bData, rData, sData, eData, unData, facData] = await Promise.all([
                fetchSchedules(), fetchCourses(), fetchBatches(), fetchRooms(), fetchTimeSlots(),
                fetchEmptySlots(), fetchUnscheduledCourses(), fetchFaculty()
            ]);
            setSchedules(schedData);
            setCourses(cData);
            setBatches(bData);
            setRooms(rData);
            setSlots(sData);
            setEmptySlotsData(eData);
            setUnscheduledCourses(unData || []);
            setFacultyList(facData);
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
            if (form.slot_name || allocationMode === 'clubbed') {
                const groupName = form.slot_name || (slots.find(s => s.slot_id.toString() === form.slot_id)?.slot_name);
                if (!groupName) {
                    setErrorMsg('Please select a Theory Slot Group (A–G)');
                    return;
                }
                const res = await scheduleClubbed({
                    course_id: form.course_id,
                    batch_id: form.batch_id,
                    room_number: form.room_number,
                    slot_name: groupName,
                    faculty_id: form.faculty_id ? parseInt(form.faculty_id, 10) : null
                });
                const scheduledCount = res.total_slots_scheduled || res.scheduled_count || 4;
                setSuccessMsg(`All ${scheduledCount} periods of Slot Group '${groupName}' scheduled successfully across the week!`);
            } else {
                if (!form.slot_id) {
                    setErrorMsg('Please select a time slot from the grid');
                    return;
                }
                await scheduleRoom({
                    course_id: form.course_id,
                    batch_id: form.batch_id,
                    room_number: form.room_number,
                    slot_id: form.slot_id,
                    faculty_id: form.faculty_id ? parseInt(form.faculty_id, 10) : null
                });
                setSuccessMsg('Schedule created successfully!');
            }

            setForm({ course_id: '', batch_id: '', room_number: '', slot_id: '', slot_name: '', faculty_id: '' });
            setShowSlotPicker(false);
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
            await updateSchedule(editTarget.schedule_id, {
                course_id: editForm.course_id,
                batch_id: editForm.batch_id,
                room_number: editForm.room_number,
                slot_id: editForm.slot_id,
                faculty_id: editForm.faculty_id ? parseInt(editForm.faculty_id, 10) : null
            });
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
        const matchesFaculty = filterFaculty 
            ? (s.faculty_id ? s.faculty_id.toString() === filterFaculty : false)
            : true;
        return matchesCourse && matchesDay && matchesFaculty;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-slate-500 font-medium text-sm">Loading schedules & timetable...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Add New Schedule (Coordinator only) */}
            {isCoordinator ? (
                <Card className="relative z-40 border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle>Add New Schedule Allocation</CardTitle>
                                    <CardDescription>
                                        Allocate room, faculty, and periods with automated trigger conflict validation
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {errorMsg && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        )}
                        {successMsg && (
                            <Alert variant="success" className="mb-4">
                                <CheckCircle2 className="w-4 h-4" />
                                <AlertDescription>{successMsg}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
                                {/* Course */}
                                <div>
                                    <Label htmlFor="sched_course" className="mb-1.5 block">Course</Label>
                                    <Select 
                                        value={form.course_id} 
                                        onValueChange={(val) => setForm({...form, course_id: val})}
                                    >
                                        <SelectTrigger id="sched_course" className="h-9">
                                            <SelectValue placeholder="Select Course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map(c => (
                                                <SelectItem key={c.course_id} value={c.course_id.toString()}>
                                                    {c.course_code} — {c.course_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Batch */}
                                <div>
                                    <Label htmlFor="sched_batch" className="mb-1.5 block">Batch</Label>
                                    <Select 
                                        value={form.batch_id} 
                                        onValueChange={(val) => setForm({...form, batch_id: val})}
                                    >
                                        <SelectTrigger id="sched_batch" className="h-9">
                                            <SelectValue placeholder="Select Batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {batches.map(b => (
                                                <SelectItem key={b.batch_id} value={b.batch_id.toString()}>
                                                    Year {b.year_of_study} - {b.section} ({b.student_count} students)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Faculty */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <Label htmlFor="sched_faculty">Faculty</Label>
                                        {existingFacultyForCourseBatch && (
                                            <Badge variant="joint" className="text-[10px] py-0 px-1.5">Locked</Badge>
                                        )}
                                    </div>
                                    <Select 
                                        value={form.faculty_id} 
                                        disabled={!!existingFacultyForCourseBatch}
                                        onValueChange={(val) => setForm({...form, faculty_id: val})}
                                    >
                                        <SelectTrigger id="sched_faculty" className="h-9">
                                            <SelectValue placeholder="No Faculty / Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">No Faculty / Unassigned</SelectItem>
                                            {facultyList.map(f => (
                                                <SelectItem key={f.faculty_id} value={f.faculty_id.toString()}>
                                                    {f.faculty_name} ({f.designation || 'Faculty'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Room */}
                                <div>
                                    <Label htmlFor="sched_room" className="mb-1.5 block">Room</Label>
                                    <Select 
                                        value={form.room_number} 
                                        onValueChange={(val) => setForm({...form, room_number: val})}
                                    >
                                        <SelectTrigger id="sched_room" className="h-9">
                                            <SelectValue placeholder="Select Room" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rooms.map(r => (
                                                <SelectItem key={r.room_number} value={r.room_number}>
                                                    {r.room_number} ({r.room_type}, Cap: {r.capacity})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Slot Picker Trigger */}
                                <div className="relative">
                                    <Label className="mb-1.5 block">Time Slot / Group</Label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowSlotPicker(!showSlotPicker)}
                                        className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm shadow-xs transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 truncate font-medium"
                                    >
                                        {form.slot_name ? (() => {
                                            const groupPeriods = slots.filter(s => s.slot_name === form.slot_name);
                                            return (
                                                <span className="flex items-center gap-1.5 text-amber-900 font-bold truncate">
                                                    <Badge variant="theory">Slot {form.slot_name}</Badge>
                                                    <span>All {groupPeriods.length} periods in week</span>
                                                </span>
                                            );
                                        })() : form.slot_id ? (() => {
                                            const s = slots.find(slot => slot.slot_id.toString() === form.slot_id);
                                            return s ? (
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <Badge variant={s.slot_type === 'Lab' ? 'lab' : 'theory'}>{s.slot_name}</Badge>
                                                    <span className="text-slate-700">D{s.day_of_week} ({s.start_time.substring(0,5)})</span>
                                                </span>
                                            ) : 'Select Slot';
                                        })() : <span className="text-slate-400">Select Time Slot / Group</span>}
                                    </button>

                                    {showSlotPicker && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowSlotPicker(false)} />
                                            <div className="absolute z-50 top-full lg:-right-32 mt-2 w-max max-w-[92vw] shadow-2xl rounded-2xl animate-fade-up">
                                                <TimeSlotGrid 
                                                    mode="select" 
                                                    selectionMode={allocationMode}
                                                    slots={slots} 
                                                    slotConflicts={computeSlotConflicts(form.room_number, form.batch_id, form.faculty_id)}
                                                    bookedSlotIds={getBookedSlotIdsForRoom(form.room_number)} 
                                                    selectedSlotId={form.slot_id}
                                                    selectedSlotName={form.slot_name}
                                                    onSelectSlot={(slotId, slot) => {
                                                        if (slot && slot.slot_type === 'Theory') {
                                                            setForm(prev => ({ ...prev, slot_name: slot.slot_name, slot_id: '' }));
                                                            setAllocationMode('clubbed');
                                                        } else {
                                                            setForm(prev => ({ ...prev, slot_id: slotId, slot_name: '' }));
                                                            setAllocationMode('single');
                                                        }
                                                        setShowSlotPicker(false);
                                                    }}
                                                    onSelectSlotGroup={(slotName) => {
                                                        setForm(prev => ({ ...prev, slot_name: slotName, slot_id: '' }));
                                                        setAllocationMode('clubbed');
                                                        setShowSlotPicker(false);
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Linked Slot Group Preview Banner */}
                            {form.slot_name && (
                                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 animate-fade-in">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="theory" className="font-bold text-xs">
                                            Group {form.slot_name}
                                        </Badge>
                                        <span className="font-semibold text-amber-900">
                                            Linked Theory Slot Group {form.slot_name}
                                        </span>
                                        <span className="text-amber-700 hidden sm:inline">
                                            — Allocating this slot will schedule all {slots.filter(s => s.slot_name === form.slot_name).length} periods across the week:
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {slots.filter(s => s.slot_name === form.slot_name).map(s => (
                                            <span key={s.slot_id} className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] font-mono text-amber-800 font-semibold shadow-2xs">
                                                Day {s.day_of_week} Period {s.hour_order} ({s.start_time.substring(0,5)})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Helper tip for whole semester invariance */}
                            {existingFacultyForCourseBatch && (
                                <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>
                                        <strong>Semester Invariance Active:</strong> {existingFacultyForCourseBatch.name} is already assigned to this Course & Batch and will handle all scheduled slots.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end pt-1">
                                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    {form.slot_name 
                                        ? `Allocate All ${slots.filter(s => s.slot_name === form.slot_name).length} Periods for Slot ${form.slot_name}` 
                                        : 'Create Allocation'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Alert variant="default" className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                    <AlertDescription>
                        Viewer Mode — Schedule allocations are read-only. Allocation changes require Department Coordinator privileges.
                    </AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="text-slate-500 w-4 h-4" />
                    <h3 className="font-bold text-sm text-slate-800">Filter Schedules & Analyze Allocations</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search Course or Dept..."
                            className="pl-9"
                            value={searchCourse}
                            onChange={(e) => setSearchCourse(e.target.value)}
                        />
                    </div>

                    <Select value={filterDay} onValueChange={(val) => setFilterDay(val)}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Days</SelectItem>
                            <SelectItem value="1">Day 1 (Monday)</SelectItem>
                            <SelectItem value="2">Day 2 (Tuesday)</SelectItem>
                            <SelectItem value="3">Day 3 (Wednesday)</SelectItem>
                            <SelectItem value="4">Day 4 (Thursday)</SelectItem>
                            <SelectItem value="5">Day 5 (Friday)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterFaculty} onValueChange={(val) => setFilterFaculty(val)}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Faculty</SelectItem>
                            {facultyList.map(f => (
                                <SelectItem key={f.faculty_id} value={f.faculty_id.toString()}>
                                    {f.faculty_name} ({f.designation || 'Faculty'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">
                        <label className="flex items-center cursor-pointer w-full justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-800">Include Empty Slots</span>
                                <span className="text-[10px] text-slate-500">Unbooked periods</span>
                            </div>
                            <div className="relative ml-2">
                                <input type="checkbox" className="sr-only" checked={showEmptySlots} onChange={(e) => setShowEmptySlots(e.target.checked)} />
                                <div className={`block w-9 h-5 rounded-full transition-colors ${showEmptySlots ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${showEmptySlots ? 'translate-x-4' : ''}`} />
                            </div>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Unscheduled Courses Banner */}
            {unscheduledCourses.length > 0 ? (
                <div className="p-4 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border border-amber-200/80 rounded-2xl shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    Unscheduled Courses
                                    <Badge variant="theory">{unscheduledCourses.length} Pending</Badge>
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-white/90 text-xs font-semibold text-amber-900 shadow-xs transition-all ${
                                    isCoordinator ? 'hover:bg-amber-100/80 hover:border-amber-300 cursor-pointer active:scale-95' : 'cursor-default'
                                }`}
                                title={isCoordinator ? "Click to pre-fill in schedule form" : ""}
                            >
                                <span className="font-bold text-amber-800 font-mono">{c.course_code}</span>
                                <span>—</span>
                                <span>{c.course_name}</span>
                                {isCoordinator && <Plus className="w-3.5 h-3.5 text-amber-600 ml-0.5" />}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <Alert variant="success" className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <AlertDescription className="font-medium text-emerald-800">
                            All academic courses are currently allocated to active room time slots.
                        </AlertDescription>
                    </div>
                    <Badge variant="success">100% Scheduled</Badge>
                </Alert>
            )}

            {/* Master Schedule Table */}
            <Card>
                <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Master Timetable Schedule</CardTitle>
                            <CardDescription>Comprehensive grid of allocated classroom periods</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary">{filteredSchedules.length} periods</Badge>
                </CardHeader>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course</TableHead>
                                <TableHead>Faculty / Instructor</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Slot & Timing</TableHead>
                                <TableHead>Allocated By</TableHead>
                                {isCoordinator && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSchedules.map((s, index) => (
                                <TableRow key={index} className={s.dept_name === 'Empty' ? 'bg-slate-50/50 italic opacity-70' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{s.course_name}</span>
                                            <span className="text-xs text-slate-500">{s.dept_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {s.faculty_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900">{s.faculty_name}</div>
                                                    <div className="text-[10px] text-slate-500">{s.designation || 'Instructor'}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-xs">
                                        {s.year_of_study ? `Yr ${s.year_of_study} - Sec ${s.section}` : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">{s.room_number}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {s.slot_name && (
                                                <Badge variant={s.slot_type === 'Lab' ? 'lab' : 'theory'}>
                                                    {s.slot_name}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-slate-600 font-medium">
                                                D{s.day_of_week || '?'} ({s.start_time ? s.start_time.substring(0,5) : '--:--'} – {s.end_time ? s.end_time.substring(0,5) : '--:--'})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {s.created_by_name ? (
                                            <Badge variant="secondary" className="font-normal">{s.created_by_name}</Badge>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </TableCell>
                                    {isCoordinator && (
                                        <TableCell className="text-right">
                                            {s.schedule_id && s.dept_name !== 'Empty' && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditTarget(s);
                                                            setEditForm({
                                                                course_id: s.course_id?.toString() || (courses.find(c => c.course_name === s.course_name)?.course_id.toString() || ''),
                                                                batch_id: s.batch_id?.toString() || (batches.find(b => b.year_of_study === s.year_of_study && b.section === s.section)?.batch_id.toString() || ''),
                                                                room_number: s.room_number || '',
                                                                slot_id: s.slot_id?.toString() || (slots.find(slot => slot.day_of_week === s.day_of_week && slot.start_time === s.start_time)?.slot_id.toString() || ''),
                                                                faculty_id: s.faculty_id ? s.faculty_id.toString() : ''
                                                            });
                                                            setEditError('');
                                                        }}
                                                        title="Edit Allocation"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => handleDelete(s.schedule_id)}
                                                        title="Delete Schedule"
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Edit Schedule Modal */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent onClose={() => setEditTarget(null)} className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-blue-600" />
                            Edit Schedule #{editTarget?.schedule_id}
                        </DialogTitle>
                        <DialogDescription>
                            Reassign course, batch, faculty, room, or period slot
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {editError && (
                            <Alert variant="destructive">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription>{editError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit_course" className="mb-1.5 block">Course</Label>
                                <Select
                                    value={editForm.course_id}
                                    onValueChange={(val) => setEditForm({ ...editForm, course_id: val })}
                                >
                                    <SelectTrigger id="edit_course" className="h-9">
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.course_id} value={c.course_id.toString()}>
                                                {c.course_code} — {c.course_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit_batch" className="mb-1.5 block">Batch</Label>
                                <Select
                                    value={editForm.batch_id}
                                    onValueChange={(val) => setEditForm({ ...editForm, batch_id: val })}
                                >
                                    <SelectTrigger id="edit_batch" className="h-9">
                                        <SelectValue placeholder="Select Batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map(b => (
                                            <SelectItem key={b.batch_id} value={b.batch_id.toString()}>
                                                Year {b.year_of_study} - {b.section} ({b.student_count} students)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit_faculty" className="mb-1.5 block">Faculty / Instructor</Label>
                                <Select
                                    value={editForm.faculty_id}
                                    onValueChange={(val) => setEditForm({ ...editForm, faculty_id: val })}
                                >
                                    <SelectTrigger id="edit_faculty" className="h-9">
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {facultyList.map(f => (
                                            <SelectItem key={f.faculty_id} value={f.faculty_id.toString()}>
                                                {f.faculty_name} ({f.designation || 'Faculty'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit_room" className="mb-1.5 block">Room</Label>
                                <Select
                                    value={editForm.room_number}
                                    onValueChange={(val) => setEditForm({ ...editForm, room_number: val })}
                                >
                                    <SelectTrigger id="edit_room" className="h-9">
                                        <SelectValue placeholder="Select Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(r => (
                                            <SelectItem key={r.room_number} value={r.room_number}>
                                                {r.room_number} ({r.room_type}, Cap: {r.capacity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative md:col-span-2">
                                <Label className="mb-1.5 block">Time Slot</Label>
                                <button 
                                    type="button" 
                                    onClick={() => setEditShowSlotPicker(!editShowSlotPicker)}
                                    className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm shadow-xs hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                                >
                                    {editForm.slot_id ? (() => {
                                        const s = slots.find(slot => slot.slot_id.toString() === editForm.slot_id);
                                        return s ? `Day ${s.day_of_week} • Slot ${s.slot_name} (${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)})` : 'Select Slot';
                                    })() : 'Select Slot'}
                                </button>

                                {editShowSlotPicker && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setEditShowSlotPicker(false)} />
                                        <div className="absolute z-50 top-full left-0 right-0 mt-2 shadow-2xl rounded-2xl animate-fade-up">
                                            <TimeSlotGrid 
                                                mode="select" 
                                                selectionMode="single"
                                                slots={slots} 
                                                slotConflicts={computeSlotConflicts(editForm.room_number, editForm.batch_id, editForm.faculty_id, editTarget?.schedule_id)}
                                                bookedSlotIds={getBookedSlotIdsForRoom(editForm.room_number, editTarget?.schedule_id)} 
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editLoading}>
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
