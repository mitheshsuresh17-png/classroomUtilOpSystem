import { useEffect, useState } from 'react';
import { fetchBatches, createBatch, updateBatch, deleteBatch, fetchBatchImpact, fetchDepartments, Department } from '../lib/api';
import { Users, Search, Plus, Pencil, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';

interface Batch {
    batch_id: string;
    year_of_study: number;
    section: string;
    student_count: number;
    dept_id: number;
    dept_name?: string;
}

export default function BatchList() {
    const { user } = useAuth();
    const isCoordinator = user?.role === 'coordinator';

    const [batches, setBatches] = useState<Batch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');

    // Form
    const [form, setForm] = useState({ batch_id: '', year_of_study: '1', section: 'A', student_count: '', dept_id: '1' });
    const [showForm, setShowForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Edit Modal State
    const [editTarget, setEditTarget] = useState<Batch | null>(null);
    const [editForm, setEditForm] = useState({ year_of_study: '1', section: 'A', student_count: '', dept_id: '1' });
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Cascade delete state
    const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await createBatch({ 
                ...form, 
                batch_id: parseInt(form.batch_id), 
                year_of_study: parseInt(form.year_of_study),
                student_count: parseInt(form.student_count),
                dept_id: parseInt(form.dept_id)
            });
            setSuccessMsg('Batch created successfully!');
            setForm({ batch_id: '', year_of_study: '1', section: 'A', student_count: '', dept_id: departments[0]?.dept_id.toString() || '1' });
            setShowForm(false);
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred');
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
                dept_id: parseInt(editForm.dept_id)
            });
            setEditTarget(null);
            loadData();
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [batchData, deptData] = await Promise.all([
                fetchBatches(),
                fetchDepartments()
            ]);
            setBatches(batchData);
            setDepartments(deptData);
            if (deptData.length > 0 && !form.dept_id) {
                setForm(f => ({ ...f, dept_id: deptData[0].dept_id.toString() }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              batch.year_of_study.toString().includes(searchQuery) ||
                              (batch.dept_name && batch.dept_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="space-y-5">
            {/* Header & Role Notice */}
            <div className="flex items-center justify-between">
                {isCoordinator ? (
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
                        {showForm ? 'Cancel' : 'Add New Batch'}
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Viewer Mode — Batch creation and deletion restricted to Coordinators
                    </div>
                )}
            </div>

            {isCoordinator && showForm && (
                <div className="card p-5 animate-fade-up">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Batch</h2>
                    {errorMsg && <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>}
                    {successMsg && <div className="mb-4 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm">{successMsg}</div>}
                    
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Manual Batch ID</label>
                            <input required type="number" placeholder="e.g. 204" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Year of Study</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white" value={form.year_of_study} onChange={e => setForm({...form, year_of_study: e.target.value})}>
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Section</label>
                            <input required maxLength={1} type="text" placeholder="e.g. A" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm uppercase" value={form.section} onChange={e => setForm({...form, section: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Student Count</label>
                            <input required min="1" type="number" placeholder="e.g. 60" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.student_count} onChange={e => setForm({...form, student_count: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Department</label>
                            <select 
                                required 
                                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white" 
                                value={form.dept_id} 
                                onChange={e => setForm({...form, dept_id: e.target.value})}
                            >
                                {departments.map(d => (
                                    <option key={d.dept_id} value={d.dept_id.toString()}>
                                        {d.dept_name} (ID: {d.dept_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-5 mt-2">
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md hover:bg-blue-700 transition-colors">Create Batch</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Directory Card */}
            <div className="card p-5 animate-fade-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Batch Directory</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by section/year..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors w-48"
                            />
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-lg">{filteredBatches.length} batches</span>
                    </div>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            <span className="text-gray-400 text-sm">Loading directory...</span>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Batch ID</th>
                                    <th>Year of Study</th>
                                    <th>Section</th>
                                    <th>Student Count</th>
                                    <th>Department</th>
                                    {isCoordinator && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBatches.length > 0 ? filteredBatches.map((batch, index) => (
                                    <tr key={index}>
                                        <td className="font-semibold text-gray-900">{batch.batch_id}</td>
                                        <td>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                                                Year {batch.year_of_study}
                                            </span>
                                        </td>
                                        <td className="font-semibold text-gray-800">{batch.section}</td>
                                        <td className="font-medium text-blue-600">{batch.student_count} Students</td>
                                        <td className="text-gray-500 text-sm">{batch.dept_name || `Dept #${batch.dept_id}`}</td>
                                        {isCoordinator && (
                                            <td className="text-right">
                                                <button 
                                                    onClick={() => {
                                                        setEditTarget(batch);
                                                        setEditForm({
                                                            year_of_study: batch.year_of_study.toString(),
                                                            section: batch.section,
                                                            student_count: batch.student_count.toString(),
                                                            dept_id: batch.dept_id.toString()
                                                        });
                                                        setEditError('');
                                                    }}
                                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                    title="Edit Batch"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteTarget(batch)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )) : null}
                                {filteredBatches.length === 0 && (
                                    <tr>
                                        <td colSpan={isCoordinator ? 6 : 5} className="text-center py-8 text-gray-400">
                                            No batches match your filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Batch Modal */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Edit Batch #{editTarget.batch_id}</h3>
                                    <p className="text-xs text-slate-500">Modify cohort configuration and size</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditTarget(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {editError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{editError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Batch ID (Locked)</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={editTarget.batch_id}
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Department</label>
                                    <select
                                        required
                                        value={editForm.dept_id}
                                        onChange={(e) => setEditForm({ ...editForm, dept_id: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        {departments.map(d => (
                                            <option key={d.dept_id} value={d.dept_id.toString()}>
                                                {d.dept_name} (ID: {d.dept_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Year of Study</label>
                                    <select
                                        required
                                        value={editForm.year_of_study}
                                        onChange={(e) => setEditForm({ ...editForm, year_of_study: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    >
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Section</label>
                                    <input
                                        required
                                        maxLength={1}
                                        type="text"
                                        value={editForm.section}
                                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Student Count</label>
                                    <input
                                        required
                                        min="1"
                                        type="number"
                                        value={editForm.student_count}
                                        onChange={(e) => setEditForm({ ...editForm, student_count: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400">Note: Database triggers enforce that student count does not exceed room capacity in existing scheduled slots.</p>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditTarget(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
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
