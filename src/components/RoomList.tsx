import React, { useEffect, useState } from 'react';
import { fetchRooms, fetchFreeRooms, fetchTimeSlots, fetchSchedules, createRoom, updateRoom, deleteRoom, fetchRoomImpact } from '../lib/api';
import { Filter, Search, Building2, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import TimeSlotGrid, { TimeSlot } from './TimeSlotGrid';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';

interface Room {
    room_number: string;
    room_type: string;
    capacity: number;
    resources: string | null;
}

export default function RoomList() {
    const { user } = useAuth();
    const isCoordinator = user?.role === 'coordinator';

    const [rooms, setRooms] = useState<Room[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [minCap, setMinCap] = useState('');
    const [maxCap, setMaxCap] = useState('');
    const [showFreeOnly, setShowFreeOnly] = useState(false);

    // Form
    const [form, setForm] = useState({ room_number: '', room_type: 'Classroom', capacity: '' });
    const [showForm, setShowForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Edit Modal State
    const [editTarget, setEditTarget] = useState<Room | null>(null);
    const [editForm, setEditForm] = useState({ room_type: 'Classroom', capacity: '' });
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Cascade Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await createRoom({ ...form, capacity: parseInt(form.capacity) });
            setSuccessMsg('Room created successfully!');
            setForm({ room_number: '', room_type: 'Classroom', capacity: '' });
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
            await updateRoom(editTarget.room_number, {
                room_type: editForm.room_type,
                capacity: parseInt(editForm.capacity)
            });
            setEditTarget(null);
            loadData();
        } catch (err: any) {
            setEditError(err.message || 'Failed to update room');
        } finally {
            setEditLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteRoom(deleteTarget.room_number);
        await loadData();
    };

    useEffect(() => {
        loadData();
    }, [showFreeOnly]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rData, sData, slotData] = await Promise.all([
                showFreeOnly ? fetchFreeRooms() : fetchRooms(),
                fetchSchedules(),
                fetchTimeSlots()
            ]);
            setRooms(rData);
            setSchedules(sData);
            setSlots(slotData || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter ? room.room_type === typeFilter : true;
        const matchesMinCap = minCap ? room.capacity >= parseInt(minCap) : true;
        const matchesMaxCap = maxCap ? room.capacity <= parseInt(maxCap) : true;
        return matchesSearch && matchesType && matchesMinCap && matchesMaxCap;
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
                        {showForm ? 'Cancel' : 'Add New Room'}
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Viewer Mode — Room creation and deletion restricted to Coordinators
                    </div>
                )}
            </div>


            {showForm && (
                <div className="card p-5 animate-fade-up">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Room</h2>
                    {errorMsg && <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>}
                    {successMsg && <div className="mb-4 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm">{successMsg}</div>}
                    
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room Number (Primary Key)</label>
                            <input required type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm uppercase" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room Type</label>
                            <select required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                                <option value="Classroom">Classroom</option>
                                <option value="Lab">Lab</option>
                                <option value="Lecture Hall">Lecture Hall</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Capacity</label>
                            <input required type="number" min="1" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                        </div>
                        <div className="md:col-span-3 mt-2">
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md">Create Room</button>
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
                    <h3 className="font-bold text-gray-800">Filter Rooms & Analytics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find Room..."
                            className="pl-10 w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Type */}
                    <select
                        className="border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Lab">Lab</option>
                        <option value="Lecture Hall">Lecture Hall</option>
                    </select>

                    {/* Min/Max */}
                    <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                        <input type="number" placeholder="Min Cap" className="w-full bg-transparent p-2.5 text-sm focus:outline-none" value={minCap} onChange={(e) => setMinCap(e.target.value)} />
                        <div className="border-l border-gray-200" />
                        <input type="number" placeholder="Max Cap" className="w-full bg-transparent p-2.5 text-sm focus:outline-none" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} />
                    </div>

                    {/* EXCEPT Toggle */}
                    <div className="lg:col-span-2 flex items-center bg-blue-50/80 border border-blue-100 px-4 py-2.5 rounded-xl">
                        <label className="flex items-center cursor-pointer w-full justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Show Completely Free Rooms Only</span>
                                <span className="text-xs text-blue-500">Uses EXCEPT logic (NOT IN Subquery)</span>
                            </div>
                            <div className="relative ml-3">
                                <input type="checkbox" className="sr-only" checked={showFreeOnly} onChange={(e) => setShowFreeOnly(e.target.checked)} />
                                <div className={`block w-11 h-6 rounded-full transition-colors ${showFreeOnly ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showFreeOnly ? 'translate-x-5' : ''}`} />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Room List Table */}
            <div className="card animate-fade-up" style={{ animationDelay: '100ms' }}>
                <div className="card-header flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-800">Directory Results</h2>
                    </div>
                    <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-lg">{filteredRooms.length} rooms</span>
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
                                    <th>Room Number</th>
                                    <th>Type</th>
                                    <th>Capacity</th>
                                    {isCoordinator && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.length > 0 ? filteredRooms.map((room, index) => {
                                    const isExpanded = expandedRoomId === room.room_number;
                                    
                                    const roomSchedules = schedules.filter(s => s.room_number === room.room_number);
                                    const bookedSlotIds = roomSchedules.map(sched => {
                                        const matchingSlot = slots.find(s => s.day_of_week === sched.day_of_week && s.start_time === sched.start_time);
                                        return matchingSlot ? matchingSlot.slot_id.toString() : null;
                                    }).filter(Boolean) as string[];

                                    return (
                                        <React.Fragment key={index}>
                                            <tr 
                                                className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                                                onClick={() => setExpandedRoomId(isExpanded ? null : room.room_number)}
                                            >
                                                <td className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                    {room.room_number}
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                                                        {room.room_type}
                                                    </span>
                                                </td>
                                                <td className="font-medium text-gray-600">{room.capacity} seats</td>
                                                {isCoordinator && (
                                                    <td className="text-right">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditTarget(room);
                                                                setEditForm({ room_type: room.room_type, capacity: room.capacity.toString() });
                                                                setEditError('');
                                                            }}
                                                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                            title="Edit Room"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteTarget(room);
                                                            }}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Room"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-blue-50/20">
                                                    <td colSpan={isCoordinator ? 4 : 3} className="p-4 border-b border-gray-100">
                                                        <div className="animate-fade-up">
                                                            <TimeSlotGrid 
                                                                mode="view" 
                                                                slots={slots} 
                                                                bookedSlotIds={bookedSlotIds} 
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={isCoordinator ? 4 : 3} className="text-center py-8 text-gray-400">
                                            No rooms match your filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Room Modal */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Pencil className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Edit Room {editTarget.room_number}</h3>
                                    <p className="text-xs text-slate-500">Update room type and capacity limit</p>
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

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room Number (Locked)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={editTarget.room_number}
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Room Type</label>
                                <select
                                    required
                                    value={editForm.room_type}
                                    onChange={(e) => setEditForm({ ...editForm, room_type: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                >
                                    <option value="Classroom">Classroom</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Lecture Hall">Lecture Hall</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Capacity (Seats)</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={editForm.capacity}
                                    onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Note: Database trigger prevents lowering capacity below existing scheduled batch size.</p>
                            </div>

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
                    title="Delete Room"
                    itemName={`Room ${deleteTarget.room_number} (${deleteTarget.room_type})`}
                    itemType="room"
                    fetchImpact={() => fetchRoomImpact(deleteTarget.room_number)}
                />
            )}
        </div>
    );
}
