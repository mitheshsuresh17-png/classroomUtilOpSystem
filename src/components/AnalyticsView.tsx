import { useEffect, useState } from 'react';
import {
  fetchDepartmentCourseLoad,
  fetchUnscheduledCourses,
  fetchRoomSaturation,
  fetchInfrastructureAverages,
  fetchTriggerTroubleshooting,
  fetchInfrastructureSorting,
  fetchTrappedCapacity,
  fetchBatches,
  fetchRooms
} from '../lib/api';
import { 
  BarChart, Activity, AlertTriangle, HelpCircle, 
  Database, ListTodo, ShieldAlert, Cpu
} from 'lucide-react';

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  
  // States for all 8 analytical datasets
  const [deptCourseLoad, setDeptCourseLoad] = useState<any[]>([]);
  const [unscheduledCourses, setUnscheduledCourses] = useState<any[]>([]);
  const [roomSaturation, setRoomSaturation] = useState<any[]>([]);
  const [infraAverages, setInfraAverages] = useState<any[]>([]);
  const [triggerTroubleshooting, setTriggerTroubleshooting] = useState<any[]>([]);
  const [infraSorting, setInfraSorting] = useState<any[]>([]);
  const [trappedCapacity, setTrappedCapacity] = useState<any[]>([]);

  // Configurable Parameters for native filters
  const [minSaturation, setMinSaturation] = useState(90);
  const [triggerBatch, setTriggerBatch] = useState('201');
  const [triggerRoom, setTriggerRoom] = useState('UB102');

  // Master data for dropdowns
  const [batches, setBatches] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [
        loadData, unscheduledData, saturationData,
        averagesData, triggerData, sortingData, trappedData,
        bData, rData
      ] = await Promise.all([
        fetchDepartmentCourseLoad(),
        fetchUnscheduledCourses(),
        fetchRoomSaturation(minSaturation / 100),
        fetchInfrastructureAverages(),
        fetchTriggerTroubleshooting(triggerBatch, triggerRoom),
        fetchInfrastructureSorting(),
        fetchTrappedCapacity(),
        fetchBatches(),
        fetchRooms()
      ]);

      setDeptCourseLoad(loadData);
      setUnscheduledCourses(unscheduledData);
      setRoomSaturation(saturationData);
      setInfraAverages(averagesData);
      setTriggerTroubleshooting(triggerData);
      setInfraSorting(sortingData);
      setTrappedCapacity(trappedData);
      setBatches(bData);
      setRooms(rData);
    } catch (error) {
      console.error('Failed to load analytical data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch Room Saturation when parameter changes
  useEffect(() => {
    if (!loading) {
      fetchRoomSaturation(minSaturation / 100).then(setRoomSaturation).catch(console.error);
    }
  }, [minSaturation]);

  // Re-fetch Trigger logic when parameters change
  useEffect(() => {
    if (!loading) {
      fetchTriggerTroubleshooting(triggerBatch, triggerRoom)
        .then(setTriggerTroubleshooting)
        .catch(() => setTriggerTroubleshooting([]));
    }
  }, [triggerBatch, triggerRoom]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Computing Advanced Analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-blue-600" />
          Advanced Data Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          Deep structural insights generated directly from complex SQL views, correlated subqueries, and procedural cursors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Aggregate Functions: Course Load */}
        <AnalyticCard 
          title="Highest Course Load Department" 
          icon={<BarChart className="text-indigo-500" />}
          description="(Aggregate Functions & Left Join)"
        >
          {deptCourseLoad.length > 0 ? (
            <div className="bg-indigo-50 rounded-lg p-4 flex justify-between items-center border border-indigo-100">
              <span className="font-medium text-indigo-900">{deptCourseLoad[0].dept_name}</span>
              <span className="bg-white text-indigo-700 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                {deptCourseLoad[0].total_courses} Courses
              </span>
            </div>
          ) : <div className="text-sm text-gray-500 italic">No data available</div>}
        </AnalyticCard>



        {/* 3. Joins: Unscheduled Courses */}
        <AnalyticCard 
          title="Unscheduled Orphaned Courses" 
          icon={<ListTodo className="text-orange-500" />}
          description="(LEFT JOIN where IS NULL)"
        >
          <div className="overflow-auto max-h-48">
            <table className="min-w-full text-sm">
              <thead className="bg-orange-50 text-orange-800">
                <tr><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Name</th></tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {unscheduledCourses.length > 0 ? unscheduledCourses.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{c.course_code}</td>
                    <td className="px-3 py-2 text-gray-600">{c.course_name}</td>
                  </tr>
                )) : <tr><td colSpan={2} className="px-3 py-2 text-gray-500 italic">All courses scheduled!</td></tr>}
              </tbody>
            </table>
          </div>
        </AnalyticCard>

        {/* 4. Subqueries: Room Saturation */}
        <AnalyticCard 
          title="Room Saturation Risk" 
          icon={<AlertTriangle className="text-red-500" />}
          description="(Correlated MAX Subquery)"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Threshold:</span>
            <input 
              type="number" 
              min="0" max="100" 
              value={minSaturation} 
              onChange={e => setMinSaturation(Number(e.target.value))}
              className="w-20 rounded-md border-gray-300 shadow-sm p-1 px-2 border text-sm text-center"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roomSaturation.length > 0 ? roomSaturation.map((r, i) => (
              <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-md border border-red-200 font-medium flex items-center gap-1">
                <AlertTriangle size={14} />
                {r.room_number}
              </span>
            )) : <span className="text-sm text-gray-500 italic">No rooms currently at risk.</span>}
          </div>
        </AnalyticCard>

        {/* 5. Views: Avg Infrastructure */}
        <AnalyticCard 
          title="Average Utilization by Category" 
          icon={<Database className="text-cyan-500" />}
          description="(View joined with Dimension Table)"
        >
          <div className="space-y-3">
            {infraAverages.length > 0 ? infraAverages.map((a, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{a.room_type}</span>
                  <span className="text-cyan-700 font-bold">{Number(a.avg_utilized_slots).toFixed(1)} slots avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min((a.avg_utilized_slots / 10) * 100, 100)}%` }}></div>
                </div>
              </div>
            )) : <span className="text-sm text-gray-500 italic">No data available</span>}
          </div>
        </AnalyticCard>

        {/* 6. Triggers: Troubleshooting */}
        <AnalyticCard 
          title="Trigger Block Diagnostics" 
          icon={<ShieldAlert className="text-rose-500" />}
          description="(Proving the BEFORE INSERT restriction)"
        >
          <div className="flex gap-2 mb-4">
            <select 
              value={triggerBatch} 
              onChange={e => setTriggerBatch(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm p-1 text-sm border"
            >
              {batches.map(b => <option key={b.batch_id} value={b.batch_id}>Batch {b.batch_id} (Yr {b.year_of_study})</option>)}
            </select>
            <select 
              value={triggerRoom} 
              onChange={e => setTriggerRoom(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm p-1 text-sm border"
            >
              {rooms.map(r => <option key={r.room_id} value={r.room_number}>{r.room_number}</option>)}
            </select>
          </div>
          {triggerTroubleshooting.length > 0 && triggerTroubleshooting[0].overflow_amount > 0 ? (
            <div className="bg-rose-50 rounded p-3 border border-rose-100">
              <p className="text-sm text-rose-800 mb-2 font-medium">The trigger blocked this transaction because:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <span>Attempted Students:</span><span className="font-bold text-gray-900">{triggerTroubleshooting[0].attempted_students}</span>
                <span>Max Room Capacity:</span><span className="font-bold text-gray-900">{triggerTroubleshooting[0].max_room_capacity}</span>
                <span className="text-rose-600 font-medium border-t border-rose-200 pt-1 mt-1">Overflow Amount:</span>
                <span className="text-rose-600 font-bold border-t border-rose-200 pt-1 mt-1">+{triggerTroubleshooting[0].overflow_amount} Seats</span>
              </div>
            </div>
          ) : <span className="text-sm text-gray-500 italic">No diagnostic data found.</span>}
        </AnalyticCard>

        {/* 7. Stored Functions: Sorting */}
        <AnalyticCard 
          title="Dynamic Infrastructure Sorting" 
          icon={<Cpu className="text-teal-500" />}
          description="(get_utilization_percent Stored Function)"
        >
          <div className="overflow-auto max-h-48 border rounded border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Room</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Live %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {infraSorting.length > 0 ? infraSorting.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{s.room_number} <span className="text-xs text-gray-400">({s.room_type})</span></td>
                    <td className="px-3 py-2 text-right font-medium text-teal-600">{Number(s.current_util_percent).toFixed(2)}%</td>
                  </tr>
                )) : <tr><td colSpan={2} className="px-3 py-2 text-center text-gray-500 italic">No rooms loaded</td></tr>}
              </tbody>
            </table>
          </div>
        </AnalyticCard>

        {/* 8. Cursors: Trapped Capacity */}
        <AnalyticCard 
          title="Trapped Capacity Seats" 
          icon={<Activity className="text-purple-500" />}
          description="(Extracted from evaluate_room_usage Cursor Temp Table)"
        >
          {trappedCapacity.length > 0 ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="text-5xl font-black text-purple-600 mb-2">
                {trappedCapacity[0].trapped_capacity_seats}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Total physical seats stuck in completely <strong>{trappedCapacity[0].status}</strong> rooms.
              </p>
            </div>
          ) : <span className="text-sm text-gray-500 italic">Could not read temporary cursor output.</span>}
        </AnalyticCard>

      </div>
    </div>
  );
}

function AnalyticCard({ title, icon, description, children }: { title: string, icon: React.ReactNode, description: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs font-mono text-gray-400 mt-1">{description}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg shrink-0">
          {icon}
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
