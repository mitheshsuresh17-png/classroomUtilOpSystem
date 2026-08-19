import { useEffect, useState } from 'react';
import { fetchBatches, createBatch, deleteBatch } from '../lib/api';
import { Users, Filter, Search, Plus, Trash2 } from 'lucide-react';

interface Batch {
    batch_id: string;
    year_of_study: number;
    section: string;
    student_count: number;
    dept_id: number;
}

export default function BatchList() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');

    // Form
    const [form, setForm] = useState({ batch_id: '', year_of_study: '1', section: 'A', student_count: '', dept_id: '1' });
    const [showForm, setShowForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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
            setForm({ batch_id: '', year_of_study: '1', section: 'A', student_count: '', dept_id: '1' });
            setShowForm(false);
            loadBatches();
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this batch? This will also delete any schedules allocated for this batch.')) return;
        try {
            await deleteBatch(id);
            loadBatches();
        } catch (err: any) {
            alert(err.message || 'Failed to delete batch');
        }
    };

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            setLoading(true);
            const data = await fetchBatches();
            setBatches(data);
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              batch.year_of_study.toString().includes(searchQuery);
        return matchesSearch;
    });

    return (
        <div className="space-y-5">
            {/* Add New Header / Form */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
                    {showForm ? 'Cancel' : 'Add New Batch'}
                </button>
            </div>

            {showForm && (
                <div className="card p-5 animate-fade-up">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Batch</h2>
                    {errorMsg && <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>}
                    {successMsg && <div className="mb-4 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm">{successMsg}</div>}
                    
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Manual Batch ID</label>
                            <input required type="number" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Year of Study</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.year_of_study} onChange={e => setForm({...form, year_of_study: e.target.value})}>
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Section</label>
                            <input required type="text" maxLength={1} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm uppercase" value={form.section} onChange={e => setForm({...form, section: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Student Count</label>
                            <input required type="number" min="1" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.student_count} onChange={e => setForm({...form, student_count: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Dept ID</label>
                            <input required type="number" min="1" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})} />
                        </div>
                        <div className="md:col-span-5 mt-2">
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md">Create Batch</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters Card */}
            <div className="card p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Filter className="text-gray-500 w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800">Filter Batches</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Year or Section..."
                            className="pl-10 w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Batch List Table */}
            <div className="card animate-fade-up" style={{ animationDelay: '100ms' }}>
                <div className="card-header flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-800">Batch Directory</h2>
                    </div>
                    <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-lg">{filteredBatches.length} batches</span>
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
                                    <th>Dept ID</th>
                                    <th></th>
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
                                        <td className="text-gray-500 font-mono text-sm">{batch.dept_id}</td>
                                        <td className="text-right">
                                            <button 
                                                onClick={() => handleDelete(batch.batch_id.toString())}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Batch"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-400">
                                            No batches match your filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
