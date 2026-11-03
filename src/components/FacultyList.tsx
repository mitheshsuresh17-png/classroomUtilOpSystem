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
  X, Clock, Users, BookOpen
} from 'lucide-react';

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
      setFaculty(facData || []);
      setDepartments(deptData || []);
    } catch (err: any) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      faculty_id: '',
      faculty_name: '',
      email: '',
      dept_id: departments[0]?.dept_id?.toString() || '1',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.faculty_name.trim()) {
      setFormError('Faculty name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await updateFaculty(Number(formData.faculty_id), {
          faculty_name: formData.faculty_name.trim(),
          email: formData.email.trim(),
          dept_id: Number(formData.dept_id),
          designation: formData.designation,
          max_weekly_slots: Number(formData.max_weekly_slots)
        });
        showToast(`Faculty member "${formData.faculty_name}" updated successfully.`);
      } else {
        await createFaculty({
          faculty_id: Number(formData.faculty_id),
          faculty_name: formData.faculty_name.trim(),
          email: formData.email.trim(),
          dept_id: Number(formData.dept_id),
          designation: formData.designation,
          max_weekly_slots: Number(formData.max_weekly_slots)
        });
        showToast(`Faculty member "${formData.faculty_name}" created successfully.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openTimetable = async (f: Faculty) => {
    setTimetableTarget(f);
    setLoadingTimetable(true);
    try {
      const data = await fetchFacultyTimetable(f.faculty_id);
      setTimetableData(data || []);
    } catch (err: any) {
      console.error('Failed to load faculty timetable:', err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  // Filtered faculty
  const filteredFaculty = faculty.filter(f => {
    const matchesSearch =
      f.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'all' || f.dept_id.toString() === selectedDept;
    const matchesDesig = selectedDesignation === 'all' || f.designation === selectedDesignation;
    return matchesSearch && matchesDept && matchesDesig;
  });

  // KPI Calculations
  const totalSlotsAssigned = faculty.reduce((acc, f) => acc + (f.assigned_slots || 0), 0);
  const avgUtilization = faculty.length > 0
    ? Math.round(faculty.reduce((acc, f) => acc + Number(f.utilization_percent || 0), 0) / faculty.length)
    : 0;
  const saturatedCount = faculty.filter(f => Number(f.utilization_percent || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
              {faculty.length} Instructors Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Monitor teaching workloads, manage department rosters, and enforce timetable shift constraints.
          </p>
        </div>

        {isCoordinator && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-indigo-500/20 font-medium text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Faculty Member
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{faculty.length}</div>
            <div className="text-xs text-gray-500 font-medium">Total Faculty Members</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalSlotsAssigned}</div>
            <div className="text-xs text-gray-500 font-medium">Total Weekly Slots Assigned</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{avgUtilization}%</div>
            <div className="text-xs text-gray-500 font-medium">Average Teaching Load</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${saturatedCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{saturatedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Near Capacity (&ge;80% Load)</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id.toString()}>
                {d.dept_name}
              </option>
            ))}
          </select>

          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Adjunct Lecturer">Adjunct Lecturer</option>
          </select>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Teaching Workload</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading faculty roster...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No faculty members found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((f) => {
                  const utilPercent = Number(f.utilization_percent || 0);
                  const progressColor =
                    utilPercent >= 80 ? 'bg-rose-500' :
                    utilPercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <tr key={f.faculty_id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {f.faculty_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{f.faculty_name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {f.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                          <Building className="w-3 h-3 text-gray-400" />
                          {f.dept_name || `Dept #${f.dept_id}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          f.designation === 'Professor' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          f.designation === 'Associate Professor' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {f.designation}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 w-64">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-gray-700">
                              {f.assigned_slots || 0} / {f.max_weekly_slots} slots
                            </span>
                            <span className={`${utilPercent >= 80 ? 'text-rose-600' : 'text-gray-500'}`}>
                              {utilPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-300`}
                              style={{ width: `${Math.min(100, utilPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openTimetable(f)}
                            title="View Faculty Weekly Timetable"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {isCoordinator && (
                            <>
                              <button
                                onClick={() => openEditModal(f)}
                                title="Edit Faculty"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(f)}
                                title="Delete Faculty"
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  {isEditing ? 'Edit Faculty Details' : 'Add New Faculty Member'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Faculty ID (Positive Number)
                </label>
                <input
                  type="number"
                  disabled={isEditing}
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  placeholder="e.g. 1005"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100 disabled:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name (with Prefix)
                </label>
                <input
                  type="text"
                  value={formData.faculty_name}
                  onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                  placeholder="e.g. Dr. Margaret Hamilton"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. m.hamilton@college.edu"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.dept_id}
                    onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.dept_id} value={d.dept_id.toString()}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Lecturer">Adjunct Lecturer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Weekly Teaching Slots (1 - 30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.max_weekly_slots}
                  onChange={(e) => setFormData({ ...formData, max_weekly_slots: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <span className="text-[11px] text-gray-400">Institutional standard is 14–16 slots/week.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Timetable Modal */}
      {timetableTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {timetableTarget.faculty_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{timetableTarget.faculty_name}'s Timetable</h3>
                  <p className="text-xs text-gray-400">
                    {timetableTarget.designation} &bull; {timetableTarget.dept_name || `Dept #${timetableTarget.dept_id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTimetableTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingTimetable ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Fetching faculty schedule...</span>
                </div>
              ) : timetableData.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="font-medium text-gray-600">No scheduled sessions</p>
                  <p className="text-xs text-gray-400">This instructor currently has zero assigned timetable commitments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium pb-2 border-b">
                    <span>{timetableData.length} active teaching periods</span>
                    <span>Max Allowed: {timetableTarget.max_weekly_slots} slots</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {timetableData.map((s: any) => (
                      <div
                        key={s.schedule_id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                          s.slot_type === 'Lab'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{s.course_code}</div>
                            <div className="text-xs text-gray-600 line-clamp-1">{s.course_name}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.slot_type === 'Lab' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Slot {s.slot_name || s.slot_id}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200/50">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>Day {s.day_of_week} &bull; {s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-gray-700">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            <span>{s.room_number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cascade Deletion Modal */}
      {deleteTarget && (
        <CascadeDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteFaculty(deleteTarget.faculty_id);
            showToast(`Faculty member "${deleteTarget.faculty_name}" deleted.`);
            setDeleteTarget(null);
            loadData();
          }}
          title="Delete Faculty Member"
          itemName={deleteTarget.faculty_name}
          itemType="faculty"
          fetchImpact={async () => {
            const impact = await fetchFacultyImpact(deleteTarget.faculty_id);
            return {
              schedules_count: impact.schedules_count
            };
          }}
        />
      )}
    </div>
  );
}
