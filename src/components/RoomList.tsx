import { useEffect, useState } from 'react';
import { fetchRooms, fetchFreeRooms } from '../lib/api';
import { Filter, Search, Building2 } from 'lucide-react';

interface Room {
    room_id: string;
    room_number: string;
    room_type: string;
    capacity: number;
}

export default function RoomList() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [minCap, setMinCap] = useState('');
    const [maxCap, setMaxCap] = useState('');
    const [showFreeOnly, setShowFreeOnly] = useState(false);

    useEffect(() => {
        loadRooms();
    }, [showFreeOnly]);

    const loadRooms = async () => {
        try {
            setLoading(true);
            const data = showFreeOnly ? await fetchFreeRooms() : await fetchRooms();
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
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
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.length > 0 ? filteredRooms.map((room, index) => (
                                    <tr key={index}>
                                        <td className="font-semibold text-gray-900">{room.room_number}</td>
                                        <td>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                                                {room.room_type}
                                            </span>
                                        </td>
                                        <td className="font-medium text-gray-600">{room.capacity} seats</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-400">
                                            No rooms match your filter criteria.
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
