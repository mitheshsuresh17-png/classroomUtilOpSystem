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
  BarChart, Activity, AlertTriangle, 
  Database, ListTodo, ShieldAlert, Cpu
} from 'lucide-react';

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  
  const [deptCourseLoad, setDeptCourseLoad] = useState<any[]>([]);
  const [unscheduledCourses, setUnscheduledCourses] = useState<any[]>([]);
  const [roomSaturation, setRoomSaturation] = useState<any[]>([]);
  const [infraAverages, setInfraAverages] = useState<any[]>([]);
  const [triggerTroubleshooting, setTriggerTroubleshooting] = useState<any[]>([]);
  const [infraSorting, setInfraSorting] = useState<any[]>([]);
  const [trappedCapacity, setTrappedCapacity] = useState<any[]>([]);

  const [minSaturation, setMinSaturation] = useState(90);
  const [triggerBatch, setTriggerBatch] = useState('201');
  const [triggerRoom, setTriggerRoom] = useState('UB102');

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

  useEffect(() => {
    if (!loading) {
      fetchRoomSaturation(minSaturation / 100).then(setRoomSaturation).catch(console.error);
    }
  }, [minSaturation]);

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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-gray-500 font-medium">Computing Advanced Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mb-2 animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-blue-600 w-6 h-6" />
          Advanced Data Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Deep structural insights from complex SQL views, correlated subqueries, and procedural cursors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
        
        {/* 1. Course Load */}
        <AnalyticCard 
          title="Highest Course Load Department" 
          icon={<BarChart className="text-indigo-500 w-5 h-5" />}
          tag="Aggregate Functions & Left Join"
          tagColor="indigo"
        >
          {deptCourseLoad.length > 0 ? (
            <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center border border-indigo-100">
              <span className="font-semibold text-indigo-900">{deptCourseLoad[0].dept_name}</span>
              <span className="bg-white text-indigo-700 font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                {deptCourseLoad[0].total_courses} Courses
              </span>
            </div>
          ) : <EmptyState />}
        </AnalyticCard>

        {/* 3. Unscheduled Courses */}
        <AnalyticCard 
          title="Unscheduled Orphaned Courses" 
          icon={<ListTodo className="text-orange-500 w-5 h-5" />}
          tag="LEFT JOIN where IS NULL"
          tagColor="orange"
        >
          <div className="overflow-auto max-h-48 border border-gray-100 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-orange-50/80 text-orange-800 sticky top-0">
                <tr><th className="px-3 py-2.5 text-left text-xs uppercase font-semibold">Code</th><th className="px-3 py-2.5 text-left text-xs uppercase font-semibold">Name</th></tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {unscheduledCourses.length > 0 ? unscheduledCourses.map((c, i) => (
                  <tr key={i} className="hover:bg-orange-50/30">
                    <td className="px-3 py-2.5 font-medium text-orange-700">{c.course_code}</td>
                    <td className="px-3 py-2.5 text-gray-600">{c.course_name}</td>
                  </tr>
                )) : <tr><td colSpan={2} className="px-3 py-4 text-gray-400 italic text-center">All courses scheduled!</td></tr>}
              </tbody>
            </table>
          </div>
        </AnalyticCard>

        {/* 4. Room Saturation */}
        <AnalyticCard 
          title="Room Saturation Risk" 
          icon={<AlertTriangle className="text-red-500 w-5 h-5" />}
          tag="Correlated MAX Subquery"
          tagColor="red"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Threshold:</span>
            <input 
              type="number" min="0" max="100" 
              value={minSaturation} 
              onChange={e => setMinSaturation(Number(e.target.value))}
              className="w-20 rounded-xl border border-gray-200 p-1.5 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roomSaturation.length > 0 ? roomSaturation.map((r, i) => (
              <span key={i} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200 font-semibold flex items-center gap-1.5 text-sm">
                <AlertTriangle size={14} />
                {r.room_number}
              </span>
            )) : <span className="text-sm text-gray-400 italic">No rooms currently at risk.</span>}
          </div>
        </AnalyticCard>

        {/* 5. Avg Infrastructure */}
        <AnalyticCard 
          title="Average Utilization by Category" 
          icon={<Database className="text-cyan-500 w-5 h-5" />}
          tag="View joined with Dimension Table"
          tagColor="cyan"
        >
          <div className="space-y-3">
            {infraAverages.length > 0 ? infraAverages.map((a, i) => (
              <div key={i} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{a.room_type}</span>
                  <span className="text-cyan-700 font-bold">{Number(a.avg_utilized_slots).toFixed(1)} slots avg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((a.avg_utilized_slots / 10) * 100, 100)}%` }} />
                </div>
              </div>
            )) : <EmptyState />}
          </div>
        </AnalyticCard>

        {/* 6. Trigger */}
        <AnalyticCard 
          title="Trigger Block Diagnostics" 
          icon={<ShieldAlert className="text-rose-500 w-5 h-5" />}
          tag="BEFORE INSERT restriction"
          tagColor="rose"
        >
          <div className="flex gap-2 mb-4">
            <select 
              value={triggerBatch} 
              onChange={e => setTriggerBatch(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {batches.map(b => <option key={b.batch_id} value={b.batch_id}>Batch {b.batch_id} (Yr {b.year_of_study})</option>)}
            </select>
            <select 
              value={triggerRoom} 
              onChange={e => setTriggerRoom(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {rooms.map(r => <option key={r.room_id} value={r.room_number}>{r.room_number}</option>)}
            </select>
          </div>
          {triggerTroubleshooting.length > 0 && triggerTroubleshooting[0].overflow_amount > 0 ? (
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <p className="text-sm text-rose-800 mb-3 font-semibold">Trigger blocked this transaction:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <span>Attempted Students:</span><span className="font-bold text-gray-900">{triggerTroubleshooting[0].attempted_students}</span>
                <span>Max Room Capacity:</span><span className="font-bold text-gray-900">{triggerTroubleshooting[0].max_room_capacity}</span>
                <span className="text-rose-600 font-medium border-t border-rose-200 pt-2 mt-1">Overflow:</span>
                <span className="text-rose-600 font-bold border-t border-rose-200 pt-2 mt-1">+{triggerTroubleshooting[0].overflow_amount} Seats</span>
              </div>
            </div>
          ) : <span className="text-sm text-gray-400 italic">No diagnostic data found.</span>}
        </AnalyticCard>

        {/* 7. Stored Functions */}
        <AnalyticCard 
          title="Dynamic Infrastructure Sorting" 
          icon={<Cpu className="text-teal-500 w-5 h-5" />}
          tag="get_utilization_percent Stored Function"
          tagColor="teal"
        >
          <div className="overflow-auto max-h-48 border border-gray-100 rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 text-xs uppercase">Room</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-gray-500 text-xs uppercase">Live %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {infraSorting.length > 0 ? infraSorting.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 text-gray-700">{s.room_number} <span className="text-xs text-gray-400">({s.room_type})</span></td>
                    <td className="px-3 py-2.5 text-right font-semibold text-teal-600">{Number(s.current_util_percent).toFixed(2)}%</td>
                  </tr>
                )) : <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-400 italic">No rooms loaded</td></tr>}
              </tbody>
            </table>
          </div>
        </AnalyticCard>

        {/* 8. Cursors */}
        <AnalyticCard 
          title="Trapped Capacity Seats" 
          icon={<Activity className="text-purple-500 w-5 h-5" />}
          tag="evaluate_room_usage Cursor Temp Table"
          tagColor="purple"
        >
          {trappedCapacity.length > 0 ? (
            <div className="flex flex-col items-center justify-center p-6">
              <div className="text-5xl font-black gradient-text mb-2">
                {trappedCapacity[0].trapped_capacity_seats}
              </div>
              <p className="text-sm text-gray-500 text-center">
                Total physical seats stuck in completely <strong className="text-gray-700">{trappedCapacity[0].status}</strong> rooms.
              </p>
            </div>
          ) : <span className="text-sm text-gray-400 italic">Could not read temporary cursor output.</span>}
        </AnalyticCard>

      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="text-sm text-gray-400 italic">No data available</div>;
}

function AnalyticCard({ title, icon, tag, tagColor, children }: { title: string, icon: React.ReactNode, tag: string, tagColor: string, children: React.ReactNode }) {
  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            {title}
          </h3>
          <span className={`inline-block mt-1.5 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-${tagColor}-50 text-${tagColor}-600 border border-${tagColor}-100`}>
            {tag}
          </span>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl shrink-0">
          {icon}
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
