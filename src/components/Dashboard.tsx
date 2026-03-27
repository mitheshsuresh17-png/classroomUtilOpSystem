import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { fetchUtilizationReport, fetchFreeRooms, fetchSchedules, fetchRooms } from '../lib/api';

interface Stats {
  totalRooms: number;
  totalSchedules: number;
  conflicts: number;
  freeRooms: number;
}

interface RoomUtilization {
  room_number: string;
  room_type: string;
  capacity: number;
  slots_used: number;
  total_allocations?: number;
  utilization_percentage?: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalRooms: 0, totalSchedules: 0, conflicts: 0, freeRooms: 0 });
  const [utilization, setUtilization] = useState<RoomUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [utilizationData, freeRoomsData, schedulesData, roomsData] = await Promise.all([
        fetchUtilizationReport(),
        fetchFreeRooms(),
        fetchSchedules(),
        fetchRooms()
      ]);

      setUtilization(utilizationData || []);
      setStats({
        totalRooms: roomsData?.length || 0,
        totalSchedules: schedulesData?.length || 0,
        conflicts: 0,
        freeRooms: freeRoomsData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-gray-500 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Rooms', value: stats.totalRooms, icon: <Calendar className="w-5 h-5 text-blue-600" />, accent: 'stat-accent-blue', bg: 'bg-blue-50' },
    { title: 'Total Schedules', value: stats.totalSchedules, icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, accent: 'stat-accent-green', bg: 'bg-emerald-50' },
    { title: 'Conflicts', value: stats.conflicts, icon: <AlertCircle className="w-5 h-5 text-amber-600" />, accent:  'stat-accent-amber', bg: 'bg-amber-50' },
    { title: 'Free Rooms', value: stats.freeRooms, icon: <CheckCircle className="w-5 h-5 text-teal-600" />, accent: 'stat-accent-teal', bg: 'bg-teal-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((card, i) => (
          <div key={i} className={`card p-5 ${card.accent} animate-fade-up`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Utilization Table */}
      <div className="card animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Room Utilization Summary</h2>
          <span className="text-xs text-gray-400 font-medium">{utilization.length} rooms</span>
        </div>
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Allocations</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {utilization.map((room, index) => (
                <tr key={index}>
                  <td className="font-semibold text-gray-900">{room.room_number}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                      {room.room_type}
                    </span>
                  </td>
                  <td className="text-gray-600">{room.capacity}</td>
                  <td className="text-gray-600">{room.slots_used}</td>
                  <td>
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (room.utilization_percentage || 0) > 70
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                              : (room.utilization_percentage || 0) > 30
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${Math.min(room.utilization_percentage || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-10 text-right">
                        {room.utilization_percentage || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
