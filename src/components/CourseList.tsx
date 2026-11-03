import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Search, Filter, Lock, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { fetchCourses, createCourse, deleteCourse, fetchCourseImpact, fetchDepartments, Course, Department } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

export const CourseList: React.FC = () => {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, deptsData] = await Promise.all([fetchCourses(), fetchDepartments()]);
      setCourses(coursesData);
      setDepartments(deptsData);
      if (deptsData.length > 0 && !newDeptId) {
        setNewDeptId(deptsData[0].dept_id.toString());
      }
    } catch (err: any) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCourseType = (code: string) => {
    const suffix = code.slice(-1).toUpperCase();
    if (suffix === 'T') return { label: 'Theory Only', variant: 'theory' as const };
    if (suffix === 'P') return { label: 'Practical Only', variant: 'lab' as const };
    if (suffix === 'J') return { label: 'Joint (Theory + Lab)', variant: 'joint' as const };
    return { label: 'Course', variant: 'outline' as const };
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCourseCode.trim().toUpperCase();
    if (!newCourseId || !code || !newCourseName.trim() || !newDeptId) {
      setFormError('All fields (Course ID, Code, Name, and Department) are required.');
      return;
    }
    if (!/^[A-Z0-9]{8}[TPJ]$/.test(code)) {
      setFormError('Course code must be exactly 9 alphanumeric characters ending in T (Theory), P (Practical), or J (Joint) (e.g. 18CSC301T).');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createCourse({
        course_id: parseInt(newCourseId, 10),
        course_code: code,
        course_name: newCourseName.trim(),
        dept_id: parseInt(newDeptId, 10),
      });
      setIsAddModalOpen(false);
      setNewCourseId('');
      setNewCourseCode('');
      setNewCourseName('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCourse(deleteTarget.course_id);
    await loadData();
  };

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.course_id.toString().includes(search);
    const matchesDept = deptFilter === 'ALL' || c.dept_id.toString() === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <BookOpen className="w-5 h-5" />
            </div>
            Courses Catalog
          </h1>
          <p className="text-sm text-slate-500">Manage academic curriculum, 9-character course codes, and department allocations</p>
        </div>
        {isCoordinator && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        )}
      </div>

      {/* Viewer Read-Only Banner */}
      {!isCoordinator && (
        <Alert variant="warning" className="flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <AlertDescription>
            You have read-only access. Only coordinators can add or delete courses.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by code, title, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                    {d.dept_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Course Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading courses...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No courses found</p>
          <p className="text-xs text-slate-400 mt-1">Try changing your search query or department filter</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const typeInfo = getCourseType(course.course_code);
            return (
              <Card
                key={course.course_id}
                className="hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold tracking-wider">
                          {course.course_code}
                        </span>
                        <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug truncate" title={course.course_name}>
                        {course.course_name}
                      </CardTitle>
                      <p className="text-xs text-slate-500">{course.dept_name || `Dept #${course.dept_id}`}</p>
                    </div>
                    {isCoordinator && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(course)}
                        title="Delete Course"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-3 border-t border-slate-100 text-xs flex items-center justify-between text-slate-500">
                  <span>ID: #{course.course_id}</span>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{course.scheduled_slots || 0} active periods</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Course Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Add New Academic Course
            </DialogTitle>
            <DialogDescription>
              Create an academic course with a 9-character code ending in T (Theory), P (Practical), or J (Joint).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCourse} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="course_id" className="mb-1.5 block">Course ID (Numeric)</Label>
                <Input
                  id="course_id"
                  type="number"
                  required
                  placeholder="e.g. 104"
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="course_code">Course Code</Label>
                  <span className="text-[10px] text-slate-400 font-mono">{newCourseCode.length}/9</span>
                </div>
                <Input
                  id="course_code"
                  type="text"
                  required
                  maxLength={9}
                  placeholder="e.g. 18CSC301T"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono tracking-wider font-semibold"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Suffix guide: <span className="font-bold text-amber-700">T</span> (Theory Only), <span className="font-bold text-emerald-700">P</span> (Practical Only), or <span className="font-bold text-purple-700">J</span> (Joint Theory + Lab).
            </div>

            <div>
              <Label htmlFor="course_name" className="mb-1.5 block">Course Title / Name</Label>
              <Input
                id="course_name"
                type="text"
                required
                placeholder="e.g. Distributed Operating Systems"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dept_id" className="mb-1.5 block">Academic Department</Label>
              <Select value={newDeptId} onValueChange={(val) => setNewDeptId(val)}>
                <SelectTrigger id="dept_id" className="h-9">
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1.5" />}
                Add Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cascade Delete Modal */}
      {deleteTarget && (
        <CascadeDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Course"
          itemName={`${deleteTarget.course_code} - ${deleteTarget.course_name}`}
          itemType="course"
          fetchImpact={() => fetchCourseImpact(deleteTarget.course_id)}
        />
      )}
    </div>
  );
};
