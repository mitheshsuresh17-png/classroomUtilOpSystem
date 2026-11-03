import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Search, Filter, Lock, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { fetchCourses, createCourse, deleteCourse, fetchCourseImpact, fetchDepartments, Course, Department } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';

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
    if (suffix === 'T') return { label: 'Theory Only', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    if (suffix === 'P') return { label: 'Practical Only', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
    if (suffix === 'J') return { label: 'Joint (Theory + Lab)', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    return { label: 'Course', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Courses
          </h1>
          <p className="text-sm text-slate-400">Manage academic subjects, course codes, and department allocations</p>
        </div>
        {isCoordinator && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        )}
      </div>

      {/* Viewer Read-Only Banner */}
      {!isCoordinator && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm flex items-center space-x-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>You have read-only access. Only coordinators can add or delete courses.</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, title, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id.toString()}>
                {d.dept_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          <span>Loading courses...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">No courses found</p>
          <p className="text-xs text-slate-500 mt-1">Try changing search query or department filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const typeInfo = getCourseType(course.course_code);
            return (
              <div
                key={course.course_id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono font-bold tracking-wider">
                        {course.course_code}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-base leading-snug">{course.course_name}</h3>
                    <p className="text-xs text-slate-400">{course.dept_name || `Dept #${course.dept_id}`}</p>
                  </div>
                  {isCoordinator && (
                    <button
                      onClick={() => setDeleteTarget(course)}
                      title="Delete Course"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500">ID: #{course.course_id}</span>
                  <div className="flex items-center space-x-1 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{course.scheduled_slots || 0} active slots</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Add New Course
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Course ID (Numeric)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 104"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">Course Code (9 chars)</label>
                    <span className="text-[10px] text-slate-500 font-mono">{newCourseCode.length}/9</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    placeholder="e.g. 18CSC301T"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                Course code must end with <span className="text-amber-400 font-semibold">T</span> (Theory), <span className="text-emerald-400 font-semibold">P</span> (Practical), or <span className="text-purple-400 font-semibold">J</span> (Joint).
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Course Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing Systems"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                <select
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {departments.map((d) => (
                    <option key={d.dept_id} value={d.dept_id.toString()}>
                      {d.dept_name} (ID: {d.dept_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
