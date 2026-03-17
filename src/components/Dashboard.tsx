import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, TrendingUp, CheckCircle } from 'lucide-react';

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
  total_allocations: number;
  utilization_percentage: number;
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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const [utilizationRes, conflictsRes, freeRoomsRes, schedulesRes, roomsRes] = await Promise.all([
        fetch(`${apiUrl}/schedule-api/utilization`, { headers }),
        fetch(`${apiUrl}/schedule-api/conflicts`, { headers }),
        fetch(`${apiUrl}/schedule-api/free-rooms`, { headers }),
        fetch(`${apiUrl}/schedule-api/schedules`, { headers }),
        fetch(`${apiUrl}/data-api/rooms`, { headers }),
      ]);

      const utilizationData = await utilizationRes.json();
      const conflictsData = await conflictsRes.json();
      const freeRoomsData = await freeRoomsRes.json();
      const schedulesData = await schedulesRes.json();
      const roomsData = await roomsRes.json();

      setUtilization(utilizationData.data || []);
      setStats({
        totalRooms: roomsData.data?.length || 0,
        totalSchedules: schedulesData.data?.length || 0,
        conflicts: conflictsData.data?.length || 0,
        freeRooms: freeRoomsData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Schedules"
          value={stats.totalSchedules}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Conflicts"
          value={stats.conflicts}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          bgColor="bg-red-50"
        />
        <StatCard
          title="Free Rooms"
          value={stats.freeRooms}
          icon={<CheckCircle className="w-6 h-6 text-teal-600" />}
          bgColor="bg-teal-50"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Room Utilization Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilization.map((room, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.room_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {room.room_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {room.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {room.total_allocations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            room.utilization_percentage > 50 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(room.utilization_percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{room.utilization_percentage}%</span>
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

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

function StatCard({ title, value, icon, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}
