import React, { useEffect, useState } from 'react';
import {
  fetchUnifiedUtilization,
  fetchWastedCapacity,
  fetchTemporalStress,
  fetchUtilizationImbalance,
  fetchCapacityMismatch,
  fetchActionableSignals,
  fetchEfficiencyScore
} from '../lib/api';
import { 
  Activity, AlertTriangle, ShieldAlert, Zap, 
  TrendingDown, TrendingUp, Clock, Users,
  BarChart, ArrowRight, Gauge, CheckCircle2
} from 'lucide-react';

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [efficiency, setEfficiency] = useState<number>(0);
  const [signals, setSignals] = useState<any[]>([]);
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [wastedCapacity, setWastedCapacity] = useState<any[]>([]);
  const [temporalStress, setTemporalStress] = useState<any[]>([]);
  const [unifiedUtil, setUnifiedUtil] = useState<any[]>([]);
  const [imbalance, setImbalance] = useState<any[]>([]);

  useEffect(() => {
    loadAdvancedAnalytics();
  }, []);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const [
        effData,
        sigData,
        misData,
        wasteData,
        stressData,
        utilData,
        imbData
      ] = await Promise.all([
        fetchEfficiencyScore(),
        fetchActionableSignals(),
        fetchCapacityMismatch(),
        fetchWastedCapacity(),
        fetchTemporalStress(),
        fetchUnifiedUtilization(),
        fetchUtilizationImbalance()
      ]);

      // Handle the function return safely natively
      let scoreRaw = effData.efficiency_score || 0;
      setEfficiency(Number(scoreRaw));

      setSignals(sigData);
      setMismatches(misData);
      setWastedCapacity(wasteData);
      setTemporalStress(stressData);
      setUnifiedUtil(utilData);
      setImbalance(imbData);
    } catch (err: any) {
      console.error('Failed to load advanced analytics:', err);
      setError('Unable to securely fetch analytics data. Ensure the backend is communicating correctly.');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyConfig = (score: number) => {
    if (score >= 80) return { color: 'from-emerald-500 to-teal-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Highly Efficient', icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" /> };
    if (score >= 50) return { color: 'from-amber-400 to-orange-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Moderately Efficient', icon: <Activity className="w-8 h-8 text-amber-500" /> };
    return { color: 'from-red-500 to-rose-600', text: 'text-red-600', bg: 'bg-red-50', label: 'Critical Inefficiency', icon: <ShieldAlert className="w-8 h-8 text-red-500" /> };
  };

  const effConfig = getEfficiencyConfig(efficiency);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-pulse">
        <Gauge className="w-12 h-12 text-blue-500/50 mb-4 animate-spin-slow" />
        <span className="text-gray-500 font-medium">Running advanced utilization diagnosis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-red-800 font-bold text-lg">Diagnostics Failure</h3>
        <p className="text-red-600/80 text-sm mt-1">{error}</p>
        <button onClick={loadAdvancedAnalytics} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors text-sm">
          Retry Audit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-page-enter">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Core Efficiency Hero Card */}
        <div className="lg:w-1/3 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/40 rounded-3xl p-8 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${effConfig.color} opacity-[0.03] rounded-full blur-3xl -mr-20 -mt-20 group-hover:opacity-[0.06] transition-opacity duration-700`} />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase">System Grade</h3>
                <p className="text-xs text-gray-400 mt-0.5">Weighted infrastructure audit</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${effConfig.bg} flex items-center justify-center shadow-sm`}>
                {effConfig.icon}
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-gray-800 to-gray-500 tracking-tight">
                  {efficiency}
                </span>
                <span className="text-2xl font-bold text-gray-300">/100</span>
              </div>
              <div className="inline-flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${effConfig.bg} ${effConfig.text}`}>
                  {effConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Signals Feed */}
        <div className="lg:w-2/3 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/40 rounded-3xl p-6 lg:p-8 flex flex-col h-full md:h-[340px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              Actionable Intelligence Alerts
            </h3>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {signals.length} Critical Events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
            {signals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl p-6">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400 opacity-50" />
                <p className="text-sm font-medium">Zero structural alerts detected.</p>
                <p className="text-xs mt-1">Infrastructure is operating within optimal parameters.</p>
              </div>
            ) : (
              signals.map((signal, idx) => {
                const isRed = signal.severity_score >= 8;
                const isAmber = signal.severity_score >= 5 && signal.severity_score < 8;
                
                const bgClass = isRed ? 'bg-red-50/80 border-red-100' : isAmber ? 'bg-amber-50/80 border-amber-100' : 'bg-blue-50/80 border-blue-100';
                const textClass = isRed ? 'text-red-700' : isAmber ? 'text-amber-700' : 'text-blue-700';
                const iconClass = isRed ? 'text-red-500 bg-red-100' : isAmber ? 'text-amber-500 bg-amber-100' : 'text-blue-500 bg-blue-100';
                
                return (
                  <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border ${bgClass} transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                      {isRed ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-bold ${textClass}`}>{signal.signal_type.replace(/_/g, ' ')}</h4>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${iconClass}`}>
                          Severity {signal.severity_score}
                        </span>
                      </div>
                      <p className={`text-xs font-medium opacity-80 ${textClass}`}>{signal.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MID SECTION: Mismatches */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/40 rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              Capacity Mismatch Priorities
            </h3>
            <p className="text-xs text-gray-500 mt-1">Systemic allocations where batch size drastically opposes physical limits.</p>
          </div>
        </div>

        {mismatches.filter(m => m.mismatch_status !== 'Optimal').length === 0 ? (
          <div className="text-center text-sm font-medium text-gray-400 py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            No severe allocation mismatches detected natively by SQL cursor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 text-xs font-black uppercase text-gray-400 tracking-wider w-1/4">Location & Time</th>
                  <th className="pb-3 text-xs font-black uppercase text-gray-400 tracking-wider">Mismatch Diagnosis</th>
                  <th className="pb-3 text-xs font-black uppercase text-gray-400 tracking-wider">Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {mismatches.filter(m => m.mismatch_status !== 'Optimal').slice(0, 10).map((m, i) => {
                  const isOvercrowded = m.mismatch_status.includes('Overcrowded');
                  return (
                    <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${isOvercrowded ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {m.room_number}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800">Day {m.day_of_week}</div>
                            <div className="text-[11px] font-semibold text-gray-400">{m.start_time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isOvercrowded ? 'bg-rose-100/50 text-rose-700' : 'bg-indigo-100/50 text-indigo-700'}`}>
                          {isOvercrowded ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {m.mismatch_status}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Capacity</span>
                            <span className="text-gray-800 font-bold">{m.room_capacity} seats</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Batch</span>
                            <span className={`font-bold ${isOvercrowded ? 'text-rose-600' : 'text-gray-800'}`}>{m.batch_size} students</span>
                          </div>
                          <div className="ml-auto">
                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
                              {Number(m.fill_percentage).toFixed(0)}% Fill
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOWER SECTION: Trapped Capacity & Stress Index */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Trapped Capacity Viewer */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/40 rounded-3xl p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Trapped Capacity (Wasted Seats)
              </h3>
              <p className="text-xs text-gray-500 mt-1">Empty physical seats locked inside scheduled classes.</p>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {wastedCapacity.length === 0 ? (
              <div className="text-center text-sm font-medium text-gray-400 py-10">No trapped capacity algorithms resolved data.</div>
            ) : (
              wastedCapacity.filter(w => w.trapped_capacity > 0).slice(0,8).map((waste, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                      <BarChart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{waste.course_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 font-medium">
                        <span className="text-purple-600 font-semibold">{waste.room_number}</span>
                        <span>•</span>
                        <span>Day {waste.day_of_week} ({waste.start_time.substring(0,5)})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-rose-500">{waste.trapped_capacity} seats</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Wasted</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Temporal Stress Tracker */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-gray-200/40 rounded-3xl p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Temporal Stress Profiling
              </h3>
              <p className="text-xs text-gray-500 mt-1">Identifying hourly infrastructure bottlenecks natively.</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {temporalStress.length === 0 ? (
              <div className="text-center text-sm font-medium text-gray-400 py-10">No temporal stress periods isolated.</div>
            ) : (
              temporalStress.map((stress, i) => {
                const ratio = Number(stress.stress_ratio_percent);
                const isHigh = ratio > 80;
                return (
                  <div key={i} className="flex flex-col gap-2 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center text-[10px]">{stress.day_of_week}</span>
                        <span>{stress.start_time.substring(0, 5)} - {stress.end_time.substring(0, 5)}</span>
                      </div>
                      <span className={`text-xs font-black ${isHigh ? 'text-rose-500' : 'text-gray-500'}`}>
                        {ratio.toFixed(1)}% Load
                      </span>
                    </div>
                    {/* Visual Progress Bar simulating a mini-heatmap */}
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isHigh ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} 
                        style={{ width: `${Math.min(ratio, 100)}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {stress.active_rooms} out of {stress.total_rooms} rooms occupied
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
