import React, { useState, useEffect } from 'react';
import {
  fetchFaculty, createFaculty, updateFaculty, deleteFaculty,
  fetchFacultyImpact, fetchFacultyTimetable, fetchDepartments,
  Faculty, Department
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import {
  GraduationCap, Plus, Search, Filter, Pencil, Trash2,
  Calendar, Building, Mail, Award, AlertCircle, CheckCircle2,
  Clock, Users, BookOpen, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

export default function FacultyList() {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    faculty_id: '',
    faculty_name: '',
    email: '',
    dept_id: '',
    designation: 'Assistant Professor',
    max_weekly_slots: '16'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cascade Delete state
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);

  // Timetable view modal state
  const [timetableTarget, setTimetableTarget] = useState<Faculty | null>(null);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facData, deptData] = await Promise.all([
        fetchFaculty(),
        fetchDepartments()
      ]);
      setFaculty(facData);
      setDepartments(deptData);
    } catch (err: any) {
      console.error('Failed to load faculty roster', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      faculty_id: '',
      faculty_name: '',
      email: '',
      dept_id: departments[0]?.dept_id.toString() || '',
      designation: 'Assistant Professor',
      max_weekly_slots: '16'
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (f: Faculty) => {
    setIsEditing(true);
    setFormData({
      faculty_id: f.faculty_id.toString(),
      faculty_name: f.faculty_name,
      email: f.email,
      dept_id: f.dept_id.toString(),
      designation: f.designation,
      max_weekly_slots: f.max_weekly_slots.toString()
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await updateFaculty(formData.faculty_id, {
          faculty_name: formData.faculty_name,
          email: formData.email,
          dept_id: Number(formData.dept_id),
          designation: formData.designation,
          max_weekly_slots: Number(formData.max_weekly_slots)
        });
        showNotification(`Faculty profile for ${formData.faculty_name} updated successfully.`);
      } else {
        await createFaculty({
          faculty_id: Number(formData.faculty_id),
          faculty_name: formData.faculty_name,
          email: formData.email,
          dept_id: Number(formData.dept_id),
          designation: formData.designation,
          max_weekly_slots: Number(formData.max_weekly_slots)
        });
        showNotification(`Faculty member ${formData.faculty_name} added to roster.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaculty(deleteTarget.faculty_id);
      showNotification(`Faculty member #${deleteTarget.faculty_id} was removed.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty member.');
    }
  };

  const openTimetable = async (f: Faculty) => {
    setTimetableTarget(f);
    setLoadingTimetable(true);
    try {
      const data = await fetchFacultyTimetable(f.faculty_id);
      setTimetableData(data);
    } catch (err) {
      console.error('Failed to load faculty timetable', err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch =
      f.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.faculty_id.toString().includes(search);
    const matchesDept = selectedDept === 'all' || f.dept_id.toString() === selectedDept;
    const matchesDesig = selectedDesignation === 'all' || f.designation === selectedDesignation;
    return matchesSearch && matchesDept && matchesDesig;
  });

  const totalSlotsAssigned = faculty.reduce((acc, f) => acc + (f.assigned_slots || 0), 0);
  const avgUtilization = faculty.length
    ? Math.round(faculty.reduce((acc, f) => acc + Number(f.utilization_percent || 0), 0) / faculty.length)
    : 0;
  const saturatedCount = faculty.filter((f) => Number(f.utilization_percent || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <Alert variant="success" className="animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <AlertDescription>{successToast}</AlertDescription>
        </Alert>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty & Instructors</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor teaching workloads, manage department rosters, and enforce timetable shift constraints.
          </p>
        </div>

        {isCoordinator && (
          <Button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Faculty Member
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{faculty.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Faculty Members</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalSlotsAssigned}</div>
            <div className="text-xs text-slate-500 font-medium">Weekly Periods Assigned</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{avgUtilization}%</div>
            <div className="text-xs text-slate-500 font-medium">Average Teaching Load</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border ${
            saturatedCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{saturatedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Near Capacity (&ge;80% Load)</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search faculty by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>
          <div className="min-w-[170px]">
            <Select value={selectedDept} onValueChange={(val) => setSelectedDept(val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                    {d.dept_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px]">
            <Select value={selectedDesignation} onValueChange={(val) => setSelectedDesignation(val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                <SelectItem value="Adjunct Lecturer">Adjunct Lecturer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Faculty Table */}
      <Card>
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Faculty Roster & Workload Distribution</CardTitle>
            <CardDescription>Real-time teaching load and active semester allocations</CardDescription>
          </div>
          <Badge variant="secondary">{filteredFaculty.length} members</Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Teaching Workload</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading faculty roster...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFaculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    No faculty members found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFaculty.map((f) => {
                  const utilPercent = Number(f.utilization_percent || 0);
                  const progressColor =
                    utilPercent >= 80 ? 'bg-rose-500' :
                    utilPercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <TableRow key={f.faculty_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {f.faculty_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{f.faculty_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {f.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{f.dept_name || `Dept #${f.dept_id}`}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{f.designation}</Badge>
                      </TableCell>

                      <TableCell>
                        <div className="w-48 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {f.assigned_slots || 0} / {f.max_weekly_slots} periods
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {utilPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(utilPercent, 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {f.remaining_slots !== undefined ? `${f.remaining_slots} periods available` : ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTimetable(f)}
                            className="h-8 px-2.5 text-xs text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 border-blue-200"
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            Timetable
                          </Button>

                          {isCoordinator && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(f)}
                                title="Edit Faculty"
                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(f)}
                                title="Delete Faculty"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Faculty Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent onClose={() => setModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              {isEditing ? `Edit Faculty #${formData.faculty_id}` : 'Add New Faculty Member'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update instructor profile, department affiliation, or weekly teaching quota.'
                : 'Register an instructor into the master schedule database.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fac_id" className="mb-1.5 block">Faculty ID</Label>
                <Input
                  id="fac_id"
                  type="number"
                  required
                  disabled={isEditing}
                  placeholder="e.g. 1005"
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="fac_name" className="mb-1.5 block">Full Name</Label>
                <Input
                  id="fac_name"
                  type="text"
                  required
                  placeholder="e.g. Dr. John von Neumann"
                  value={formData.faculty_name}
                  onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fac_email" className="mb-1.5 block">College Email Address</Label>
              <Input
                id="fac_email"
                type="email"
                required
                placeholder="neumann@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fac_dept" className="mb-1.5 block">Department</Label>
                <Select
                  value={formData.dept_id?.toString()}
                  onValueChange={(val) => setFormData({ ...formData, dept_id: val })}
                >
                  <SelectTrigger id="fac_dept" className="h-9">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                        {d.dept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fac_desig" className="mb-1.5 block">Designation</Label>
                <Select
                  value={formData.designation}
                  onValueChange={(val) => setFormData({ ...formData, designation: val })}
                >
                  <SelectTrigger id="fac_desig" className="h-9">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                    <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    <SelectItem value="Adjunct Lecturer">Adjunct Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="fac_quota" className="mb-1.5 block">Weekly Max Periods Quota (1–30)</Label>
              <Input
                id="fac_quota"
                type="number"
                min={1}
                max={30}
                required
                value={formData.max_weekly_slots}
                onChange={(e) => setFormData({ ...formData, max_weekly_slots: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEditing ? 'Save Changes' : 'Create Faculty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Faculty Timetable Viewer Modal */}
      <Dialog open={!!timetableTarget} onOpenChange={(open) => !open && setTimetableTarget(null)}>
        <DialogContent onClose={() => setTimetableTarget(null)} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Teaching Timetable: {timetableTarget?.faculty_name}
            </DialogTitle>
            <DialogDescription>
              {timetableTarget?.designation} • {timetableTarget?.dept_name} ({timetableData.length} periods active)
            </DialogDescription>
          </DialogHeader>

          {loadingTimetable ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading schedule sessions...</span>
            </div>
          ) : timetableData.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No active classes allocated</p>
              <p className="text-xs text-slate-400 mt-1">This instructor has zero active classroom or lab sessions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] border border-slate-100 rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day & Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetableData.map((session, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-xs">
                        Day {session.day_of_week} ({session.start_time?.substring(0, 5)} – {session.end_time?.substring(0, 5)})
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{session.course_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{session.course_code}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        Yr {session.year_of_study} - {session.section}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{session.room_number}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.slot_type === 'Lab' ? 'lab' : 'theory'}>
                          {session.slot_name || session.slot_type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimetableTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cascade Delete Modal */}
      {deleteTarget && (
        <CascadeDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Faculty Member"
          itemName={`${deleteTarget.faculty_name} (${deleteTarget.designation})`}
          itemType="faculty"
          fetchImpact={() => fetchFacultyImpact(deleteTarget.faculty_id)}
        />
      )}
    </div>
  );
}
