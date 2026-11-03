import { useEffect, useState } from 'react';
import {
  fetchWastedCapacity,
  fetchTemporalStress,
  fetchCapacityMismatch,
  fetchActionableSignals,
  fetchEfficiencyScore,
} from '../lib/api';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  BarChart,
  ArrowRight,
  Gauge,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [efficiency, setEfficiency] = useState<number>(0);
  const [signals, setSignals] = useState<any[]>([]);
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [wastedCapacity, setWastedCapacity] = useState<any[]>([]);
  const [temporalStress, setTemporalStress] = useState<any[]>([]);

  useEffect(() => {
    loadAdvancedAnalytics();
  }, []);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const [effData, sigData, misData, wasteData, stressData] = await Promise.all([
        fetchEfficiencyScore(),
        fetchActionableSignals(),
        fetchCapacityMismatch(),
        fetchWastedCapacity(),
        fetchTemporalStress(),
      ]);

      const scoreRaw = effData?.efficiency_score || 0;
      setEfficiency(Number(scoreRaw));

      setSignals(sigData || []);
      setMismatches(misData || []);
      setWastedCapacity(wasteData || []);
      setTemporalStress(stressData || []);
    } catch (err: any) {
      console.error('Failed to load advanced analytics:', err);
      setError('Unable to fetch analytics telemetry. Ensure the backend database services are running.');
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyConfig = (score: number) => {
    if (score >= 80)
      return {
        variant: 'success' as const,
        label: 'Highly Efficient',
        icon: <CheckCircle2 className="w-7 h-7 text-emerald-600" />,
        bg: 'bg-emerald-500/10',
      };
    if (score >= 50)
      return {
        variant: 'secondary' as const,
        label: 'Moderately Efficient',
        icon: <Activity className="w-7 h-7 text-amber-600" />,
        bg: 'bg-amber-500/10',
      };
    return {
      variant: 'destructive' as const,
      label: 'Critical Inefficiency',
      icon: <ShieldAlert className="w-7 h-7 text-destructive" />,
      bg: 'bg-destructive/10',
    };
  };

  const effConfig = getEfficiencyConfig(efficiency);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Gauge className="w-10 h-10 text-primary animate-spin" />
        <span className="text-muted-foreground font-medium text-sm">
          Running utilization diagnostics & algorithm suite...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <ShieldAlert className="w-5 h-5" />
        <AlertTitle>Diagnostics Failure</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{error}</span>
          <div>
            <Button variant="outline" size="sm" onClick={loadAdvancedAnalytics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Diagnostic Audit
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="w-7 h-7 text-primary" />
            Infrastructure Telemetry & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated intelligence auditing capacity mismatches, trapped seats, and temporal bottlenecks
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAdvancedAnalytics} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Re-audit
        </Button>
      </div>

      {/* TOP SECTION: Grade & Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Efficiency Hero Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  System Grade
                </CardTitle>
                <CardDescription>Weighted utilization index</CardDescription>
              </div>
              <div className={`w-12 h-12 rounded-xl ${effConfig.bg} flex items-center justify-center`}>
                {effConfig.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tight text-foreground">
                {efficiency}
              </span>
              <span className="text-xl font-bold text-muted-foreground">/100</span>
            </div>
            <div className="mt-3">
              <Badge variant={effConfig.variant} className="text-xs py-1 px-2.5">
                {effConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Signals Feed */}
        <Card className="lg:col-span-2 flex flex-col max-h-[380px]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Actionable Intelligence Alerts</CardTitle>
            </div>
            <Badge variant="outline">{signals.length} Critical Events</Badge>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
            {signals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-xl p-8">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">Zero structural bottlenecks detected.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Venues and schedules are operating within optimal capacity parameters.
                </p>
              </div>
            ) : (
              signals.map((signal, idx) => {
                const isRed = signal.severity_score >= 8;
                const isAmber = signal.severity_score >= 5 && signal.severity_score < 8;

                const borderVariant = isRed
                  ? 'border-destructive/30 bg-destructive/5'
                  : isAmber
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-primary/30 bg-primary/5';

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${borderVariant} transition-all`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isRed
                          ? 'bg-destructive/10 text-destructive'
                          : isAmber
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isRed ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {signal.signal_type?.replace(/_/g, ' ')}
                        </h4>
                        <Badge
                          variant={isRed ? 'destructive' : 'secondary'}
                          className="text-[10px] uppercase py-0"
                        >
                          Severity {signal.severity_score}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{signal.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* MID SECTION: Capacity Mismatches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <CardTitle className="text-base">Capacity Mismatch Priorities</CardTitle>
            </div>
            <CardDescription>
              Allocations where registered student headcount drastically diverges from physical venue limit
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mismatches.filter((m) => m.mismatch_severity && m.mismatch_severity !== 'Optimal')
            .length === 0 ? (
            <div className="text-center text-sm font-medium text-muted-foreground py-10">
              No severe allocation mismatches detected.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location & Time</TableHead>
                  <TableHead>Mismatch Severity</TableHead>
                  <TableHead>Venue Capacity</TableHead>
                  <TableHead>Batch Size</TableHead>
                  <TableHead className="text-right">Fill Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mismatches
                  .filter((m) => m.mismatch_severity && m.mismatch_severity !== 'Optimal')
                  .slice(0, 10)
                  .map((m, i) => {
                    const isOvercrowded = m.mismatch_severity.includes('Overcrowd');
                    const fillPct =
                      m.room_cap > 0 ? Math.round((m.batch_size / m.room_cap) * 100) : 0;

                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                              {m.room_number}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground">
                                Day {m.day_of_week}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium">
                                {m.start_time ? m.start_time.substring(0, 5) : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOvercrowded ? 'destructive' : 'secondary'}>
                            {isOvercrowded ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {m.mismatch_severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {m.room_cap} seats
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {m.batch_size} students
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={fillPct > 100 ? 'destructive' : 'outline'}>
                            {fillPct}% Fill
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* LOWER SECTION: Trapped Capacity & Temporal Stress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trapped Capacity */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Trapped Capacity (Wasted Seats)</CardTitle>
            </div>
            <CardDescription>Empty physical chairs locked inside scheduled classes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[320px] space-y-3">
            {wastedCapacity.filter((w) => Number(w.wasted_seats) > 0).length === 0 ? (
              <div className="text-center text-sm font-medium text-muted-foreground py-10">
                No trapped capacity identified.
              </div>
            ) : (
              wastedCapacity
                .filter((w) => Number(w.wasted_seats) > 0)
                .slice(0, 8)
                .map((waste, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <BarChart className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          Sec {waste.batch_section} (Size: {waste.batch_size})
                        </h4>
                        <div className="text-[11px] text-muted-foreground">
                          {waste.room_number} (Cap {waste.room_capacity}) • Day {waste.day_of_week} (
                          {waste.start_time ? waste.start_time.substring(0, 5) : ''} -{' '}
                          {waste.end_time ? waste.end_time.substring(0, 5) : ''})
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-destructive">
                        {waste.wasted_seats} seats
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">Unused</div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Temporal Stress Tracker */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base">Temporal Stress Profiling</CardTitle>
            </div>
            <CardDescription>Hourly infrastructure concurrency bottlenecks</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[320px] space-y-3">
            {temporalStress.length === 0 ? (
              <div className="text-center text-sm font-medium text-muted-foreground py-10">
                No temporal stress periods isolated.
              </div>
            ) : (
              temporalStress.map((stress, i) => {
                const ratio = Number(stress.network_congestion_percent || 0);
                const isHigh = ratio > 80;
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px]">
                          {stress.day_of_week}
                        </span>
                        <span>
                          {stress.start_time ? stress.start_time.substring(0, 5) : ''} -{' '}
                          {stress.end_time ? stress.end_time.substring(0, 5) : ''}
                        </span>
                      </div>
                      <Badge variant={isHigh ? 'destructive' : 'secondary'} className="text-[10px]">
                        {ratio.toFixed(1)}% Load
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isHigh ? 'bg-destructive' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(ratio, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {stress.concurrent_classes} of {stress.total_rooms} venues occupied
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
