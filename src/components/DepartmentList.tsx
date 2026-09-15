import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Search, BookOpen, Users, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { fetchDepartments, createDepartment, deleteDepartment, fetchDepartmentImpact, Department } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';

export const DepartmentList: React.FC = () => {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err: any) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptId || !newDeptName.trim()) {
      setFormError('Both Department ID and Name are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createDepartment({ dept_id: parseInt(newDeptId, 10), dept_name: newDeptName.trim() });
      setIsAddModalOpen(false);
      setNewDeptId('');
      setNewDeptName('');
      await loadDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDepartment(deleteTarget.dept_id);
    await loadDepartments();
  };

  const filtered = departments.filter((d) =>
    d.dept_name.toLowerCase().includes(search.toLowerCase()) || d.dept_id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Departments
          </h1>
          <p className="text-sm text-slate-400">Manage academic departments, associated courses, and student batches</p>
        </div>
        {isCoordinator && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      {/* Viewer Read-Only Banner */}
      {!isCoordinator && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm flex items-center space-x-2">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>You have read-only access. Only coordinators can create or delete departments.</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search departments by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Loading departments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400">
          <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">No departments found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dept) => (
            <div
              key={dept.dept_id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {dept.dept_id}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base leading-snug">{dept.dept_name}</h3>
                    <p className="text-xs text-slate-400">Dept ID: {dept.dept_id}</p>
                  </div>
                </div>
                {isCoordinator && (
                  <button
                    onClick={() => setDeleteTarget(dept)}
                    title="Delete Department"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>{dept.total_courses || 0} Courses</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{dept.total_batches || 0} Batches</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Add New Department
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Department ID (Numeric)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3"
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
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
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Department</span>
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
          title="Delete Department"
          itemName={deleteTarget.dept_name}
          itemType="department"
          fetchImpact={() => fetchDepartmentImpact(deleteTarget.dept_id)}
        />
      )}
    </div>
  );
};
