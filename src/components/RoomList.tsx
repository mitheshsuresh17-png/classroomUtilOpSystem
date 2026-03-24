import React, { useEffect, useState } from 'react';
import { fetchRooms, fetchFreeRooms } from '../lib/api';
import { Filter, Search } from 'lucide-react';

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
    const [showFreeOnly, setShowFreeOnly] = useState(false); // EXCEPT SQL Logic

    useEffect(() => {
        loadRooms();
    }, [showFreeOnly]); // Re-fetch from DB when the SQL mode toggle changes

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

    // Client-side filtering on whatever dataset was returned by the API
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter ? room.room_type === typeFilter : true;
        const matchesMinCap = minCap ? room.capacity >= parseInt(minCap) : true;
        const matchesMaxCap = maxCap ? room.capacity <= parseInt(maxCap) : true;
        return matchesSearch && matchesType && matchesMinCap && matchesMaxCap;
    });

    return (
        <div className="space-y-6">
            {/* Native Filters UI */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="text-gray-500 w-5 h-5" />
                    <h3 className="font-semibold text-gray-800">Filter Rooms & Analytics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Keyword Search */}
                    <div className="relative col-span-1 lg:col-span-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find Room..."
                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Room Type */}
                    <div>
                        <select
                            className="block w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Classroom">Classroom</option>
                            <option value="Lab">Lab</option>
                            <option value="Lecture Hall">Lecture Hall</option>
                        </select>
                    </div>

                    {/* Min/Max Capacity */}
                    <div className="flex bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                        <input
                            type="number"
                            placeholder="Min Cap"
                            className="w-full bg-transparent border-0 p-2 text-sm focus:ring-0"
                            value={minCap}
                            onChange={(e) => setMinCap(e.target.value)}
                        />
                        <div className="border-l border-gray-200"></div>
                        <input
                            type="number"
                            placeholder="Max Cap"
                            className="w-full bg-transparent border-0 p-2 text-sm focus:ring-0"
                            value={maxCap}
                            onChange={(e) => setMaxCap(e.target.value)}
                        />
                    </div>

                    {/* Advanced SQL Toggle (EXCEPT Operator) */}
                    <div className="lg:col-span-2 flex items-center bg-blue-50 border border-blue-100 px-4 rounded-md">
                        <label className="flex items-center cursor-pointer w-full justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Show Completely Free Rooms Only</span>
                                <span className="text-xs text-blue-600">Uses EXCEPT logic (NOT IN Subquery)</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={showFreeOnly}
                                    onChange={(e) => setShowFreeOnly(e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${showFreeOnly ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showFreeOnly ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Room List Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Directory Results</h2>
                    <span className="text-sm text-gray-500">Showing {filteredRooms.length} rooms</span>
                </div>
                
                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading directory...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRooms.length > 0 ? filteredRooms.map((room, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{room.room_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{room.room_type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{room.capacity} seats</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
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
