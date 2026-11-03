import React, { useEffect, useState } from 'react';
import {
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  fetchBatchImpact,
  fetchDepartments,
  fetchSchedules,
  fetchTimeSlots,
  Department,
  TimeSlot,
} from '../lib/api';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  Calendar,
  Printer,
  User,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { cn } from '../lib/utils';

interface Batch {
  batch_id: string;
  year_of_study: number;
  section: string;
  student_count: number;
  dept_id: number;
  dept_name?: string;
}

interface ScheduleItem {
  schedule_id: string | number;
  course_id?: number | string;
  batch_id?: number | string;
  slot_id?: number | string;
  course_name: string;
  course_code?: string;
  dept_name?: string;
  year_of_study?: number;
  section?: string;
  room_number: string;
  room_type?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  faculty_id?: number | string | null;
  faculty_name?: string | null;
  designation?: string | null;
  slot_name?: string | null;
  slot_type?: string | null;
  hour_order?: number | null;
}

const HOUR_LABELS: Record<number, { label: string; time: string; end: string }> = {
  1: { label: 'H1', time: '08:00', end: '08:50' },
  2: { label: 'H2', time: '08:50', end: '09:40' },
  3: { label: 'H3', time: '09:45', end: '10:35' },
  4: { label: 'H4', time: '10:40', end: '11:30' },
  5: { label: 'H5', time: '11:35', end: '12:25' },
  6: { label: 'H6', time: '12:30', end: '13:20' },
  7: { label: 'H7', time: '13:25', end: '14:15' },
  8: { label: 'H8', time: '14:20', end: '15:10' },
  9: { label: 'H9', time: '15:10', end: '16:00' },
  10: { label: 'H10', time: '16:00', end: '16:50' },
};

const DAY_NAMES: Record<string, string> = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
};

export default function BatchList() {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [form, setForm] = useState({
    batch_id: '',
    year_of_study: '1',
    section: 'A',
    student_count: '',
    dept_id: '1',
  });
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState({
    year_of_study: '1',
    section: 'A',
    student_count: '',
    dept_id: '1',
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  // Timetable Dialog State
  const [selectedBatchForTimetable, setSelectedBatchForTimetable] = useState<Batch | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchData, deptData, scheduleData, slotData] = await Promise.all([
        fetchBatches(),
        fetchDepartments(),
        fetchSchedules(),
        fetchTimeSlots(),
      ]);
      setBatches(batchData);
      setDepartments(deptData);
      setSchedules(scheduleData);
      setTimeSlots(slotData);
      if (deptData.length > 0 && !form.dept_id) {
        setForm((f) => ({ ...f, dept_id: deptData[0].dept_id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching batch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreating(true);
    try {
      await createBatch({
        batch_id: parseInt(form.batch_id),
        year_of_study: parseInt(form.year_of_study),
        section: form.section.trim().toUpperCase(),
        student_count: parseInt(form.student_count),
        dept_id: parseInt(form.dept_id),
      });
      setSuccessMsg('Batch created successfully!');
      setForm({
        batch_id: '',
        year_of_study: '1',
        section: 'A',
        student_count: '',
        dept_id: departments[0]?.dept_id.toString() || '1',
      });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');
    setEditLoading(true);
    try {
      await updateBatch(editTarget.batch_id, {
        year_of_study: parseInt(editForm.year_of_study),
        section: editForm.section.trim().toUpperCase(),
        student_count: parseInt(editForm.student_count),
        dept_id: parseInt(editForm.dept_id),
      });
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update batch');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteBatch(deleteTarget.batch_id.toString());
    await loadData();
  };

  const filteredBatches = batches.filter((batch) => {
    return (
      batch.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.year_of_study.toString().includes(searchQuery) ||
      (batch.dept_name && batch.dept_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      batch.batch_id.toString().includes(searchQuery)
    );
  });

  // Calculate schedules and statistics for the currently selected batch in timetable modal
  const selectedBatchSchedules = selectedBatchForTimetable
    ? schedules.filter((s) => s.batch_id?.toString() === selectedBatchForTimetable.batch_id.toString())
    : [];

  const uniqueCoursesInBatch = Array.from(
    new Set(selectedBatchSchedules.map((s) => s.course_code || s.course_name))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Student Cohorts & Batches
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic batches, inspect whole-week timetables, and monitor student capacity
          </p>
        </div>

        {isCoordinator ? (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel Form' : 'Add New Batch'}
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Viewer Mode — Read-Only</span>
          </Badge>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <Alert variant="success" className="animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Creation Drawer / Card */}
      {showForm && (
        <Card className="border-primary/20 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Create New Academic Batch</CardTitle>
            <CardDescription>
              Assign unique identifier, curricular year, section, and total registered students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label htmlFor="batch-id">Batch ID (Numeric)</Label>
                <Input
                  id="batch-id"
                  required
                  type="number"
                  placeholder="e.g. 204"
                  value={form.batch_id}
                  onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="year-study">Year of Study</Label>
                <Select
                  value={form.year_of_study}
                  onValueChange={(val) => setForm({ ...form, year_of_study: val })}
                >
                  <SelectTrigger id="year-study">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="batch-section">Section</Label>
                <Input
                  id="batch-section"
                  required
                  maxLength={1}
                  placeholder="e.g. A"
                  className="uppercase font-semibold"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <Label htmlFor="student-count">Student Count</Label>
                <Input
                  id="student-count"
                  required
                  min="1"
                  type="number"
                  placeholder="e.g. 60"
                  value={form.student_count}
                  onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dept-select">Department</Label>
                <Select
                  value={form.dept_id}
                  onValueChange={(val) => setForm({ ...form, dept_id: val })}
                >
                  <SelectTrigger id="dept-select">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                        {d.dept_name} (ID: {d.dept_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-5 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Batch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Directory Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Batch Directory</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search batch/dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-48 text-xs"
              />
            </div>
            <Badge variant="outline">{filteredBatches.length} batches</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm font-medium">Loading batch directory...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Year of Study</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Registered Students</TableHead>
                  <TableHead>Academic Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => {
                    const batchSchedCount = schedules.filter(
                      (s) => s.batch_id?.toString() === batch.batch_id.toString()
                    ).length;

                    return (
                      <TableRow key={batch.batch_id}>
                        <TableCell className="font-semibold text-foreground">
                          #{batch.batch_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Year {batch.year_of_study}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          Sec {batch.section}
                        </TableCell>
                        <TableCell className="font-medium text-foreground/80">
                          {batch.student_count} Students
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {batch.dept_name || `Department #${batch.dept_id}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Whole Week's Timetable Action */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                              onClick={() => setSelectedBatchForTimetable(batch)}
                              title="View Whole Week's Timetable"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>Timetable</span>
                              {batchSchedCount > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full">
                                  {batchSchedCount}
                                </span>
                              )}
                            </Button>

                            {isCoordinator && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setEditTarget(batch);
                                    setEditForm({
                                      year_of_study: batch.year_of_study.toString(),
                                      section: batch.section,
                                      student_count: batch.student_count.toString(),
                                      dept_id: batch.dept_id.toString(),
                                    });
                                    setEditError('');
                                  }}
                                  title="Edit Batch"
                                >
                                  <Pencil className="w-4 h-4 text-primary" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(batch)}
                                  title="Delete Batch"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No student cohorts match your search query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Whole Week Academic Timetable Modal */}
      {selectedBatchForTimetable && (
        <Dialog
          open={!!selectedBatchForTimetable}
          onOpenChange={(open) => !open && setSelectedBatchForTimetable(null)}
        >
          <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>Weekly Academic Schedule: Batch #{selectedBatchForTimetable.batch_id}</span>
                      <Badge variant="secondary">Year {selectedBatchForTimetable.year_of_study} - Sec {selectedBatchForTimetable.section}</Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {selectedBatchForTimetable.dept_name || `Dept #${selectedBatchForTimetable.dept_id}`} • {selectedBatchForTimetable.student_count} Registered Students
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Print Timetable</span>
                  </Button>
                </div>
              </div>

              {/* Quick Summary Bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {selectedBatchSchedules.length} Scheduled Periods / Week
                  </Badge>
                  <Badge variant="theory">
                    {selectedBatchSchedules.filter((s) => s.slot_type === 'Theory').length} Theory Slots
                  </Badge>
                  <Badge variant="lab">
                    {selectedBatchSchedules.filter((s) => s.slot_type === 'Lab').length} Lab Slots
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{uniqueCoursesInBatch.length} Distinct Subjects</span>
                </div>
              </div>
            </DialogHeader>

            {/* 5-Day × 10-Period Weekly Timetable Grid */}
            <div className="py-2 overflow-x-auto">
              <div className="min-w-[920px]">
                {/* Column Headers (Periods 1 to 10) */}
                <div className="grid grid-cols-[80px_repeat(10,1fr)] gap-1.5 mb-2 text-center">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center uppercase tracking-wider">
                    Day / Period
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((hour) => {
                    const info = HOUR_LABELS[hour];
                    return (
                      <div
                        key={hour}
                        className="py-1 px-1 bg-slate-50 border border-slate-200/90 rounded-lg text-slate-700"
                      >
                        <div className="text-[11px] font-bold text-slate-800">{info.label}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{info.time}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Day Rows (Monday to Friday) */}
                <div className="space-y-2">
                  {['1', '2', '3', '4', '5'].map((day) => (
                    <div key={day} className="grid grid-cols-[80px_repeat(10,1fr)] gap-1.5">
                      {/* Day Label */}
                      <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-2">
                        <span className="text-xs font-bold text-slate-900">{DAY_NAMES[day]}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Day {day}</span>
                      </div>

                      {/* 10 Period Cells */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((hour) => {
                        const sched = selectedBatchSchedules.find((s) => {
                          if (s.slot_id) {
                            const slotObj = timeSlots.find(
                              (ts) => ts.slot_id.toString() === s.slot_id?.toString()
                            );
                            if (slotObj && slotObj.day_of_week === day && slotObj.hour_order === hour) {
                              return true;
                            }
                          }
                          return (
                            s.day_of_week === day &&
                            (s.hour_order === hour ||
                              s.start_time?.startsWith(HOUR_LABELS[hour].time))
                          );
                        });

                        if (!sched) {
                          return (
                            <div
                              key={hour}
                              className="h-20 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40 flex flex-col items-center justify-center text-[10px] text-slate-300"
                            >
                              <span>—</span>
                            </div>
                          );
                        }

                        const isLab = sched.slot_type === 'Lab' || sched.room_type === 'Lab';

                        return (
                          <div
                            key={hour}
                            className={cn(
                              'h-20 rounded-xl p-1.5 flex flex-col justify-between border text-[11px] shadow-2xs transition-all',
                              isLab
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                : 'bg-blue-50/90 border-blue-200 text-blue-950'
                            )}
                          >
                            <div>
                              <div className="font-bold font-mono tracking-tight text-xs flex items-center justify-between">
                                <span className="truncate">{sched.course_code}</span>
                                <span
                                  className={cn(
                                    'text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider',
                                    isLab
                                      ? 'bg-emerald-200/80 text-emerald-900'
                                      : 'bg-blue-200/80 text-blue-900'
                                  )}
                                >
                                  {sched.room_number}
                                </span>
                              </div>
                              <div className="text-[10px] line-clamp-1 text-slate-700 font-medium mt-0.5" title={sched.course_name}>
                                {sched.course_name}
                              </div>
                            </div>

                            <div className="text-[9px] text-slate-500 flex items-center gap-1 line-clamp-1 mt-1">
                              <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              <span className="truncate" title={sched.faculty_name || ''}>
                                {sched.faculty_name || 'Faculty Assigned'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                  <span>Theory Lecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                  <span>Practical Lab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border border-dashed border-slate-300 bg-slate-50" />
                  <span>Free Period</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBatchForTimetable(null)}
              >
                Close Timetable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Batch Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle>Edit Batch #{editTarget.batch_id}</DialogTitle>
                  <DialogDescription>Modify cohort configuration, section, and enrolled headcount</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-year">Year of Study</Label>
                  <Select
                    value={editForm.year_of_study}
                    onValueChange={(val) => setEditForm({ ...editForm, year_of_study: val })}
                  >
                    <SelectTrigger id="edit-year">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-dept">Department</Label>
                  <Select
                    value={editForm.dept_id}
                    onValueChange={(val) => setEditForm({ ...editForm, dept_id: val })}
                  >
                    <SelectTrigger id="edit-dept">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                          {d.dept_name} (ID: {d.dept_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-section">Section</Label>
                  <Input
                    id="edit-section"
                    required
                    maxLength={1}
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                    className="uppercase font-semibold"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-student-count">Student Count</Label>
                  <Input
                    id="edit-student-count"
                    required
                    min="1"
                    type="number"
                    value={editForm.student_count}
                    onChange={(e) => setEditForm({ ...editForm, student_count: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Note: Database triggers enforce that student count does not exceed room capacity in existing scheduled slots.
              </p>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Cascade Delete Modal */}
      {deleteTarget && (
        <CascadeDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Batch"
          itemName={`Batch ${deleteTarget.batch_id} (Year ${deleteTarget.year_of_study}-${deleteTarget.section})`}
          itemType="batch"
          fetchImpact={() => fetchBatchImpact(deleteTarget.batch_id)}
        />
      )}
    </div>
  );
}
