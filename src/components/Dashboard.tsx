import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Building2, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { fetchUtilizationReport, fetchFreeRooms, fetchSchedules, fetchRooms } from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';

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
          <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground font-medium text-sm">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Venues',
      value: stats.totalRooms,
      icon: <Building2 className="w-5 h-5 text-primary" />,
      bg: 'bg-primary/10',
      description: 'Physical classrooms & labs configured'
    },
    {
      title: 'Active Schedules',
      value: stats.totalSchedules,
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-500/10',
      description: 'Allocated weekly period blocks'
    },
    {
      title: 'Completely Free Venues',
      value: stats.freeRooms,
      icon: <CheckCircle2 className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-500/10',
      description: 'Zero schedule commitments'
    },
    {
      title: 'Active Conflicts',
      value: stats.conflicts,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-500/10',
      description: 'Constraint violations detected'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          Campus Resource Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time utilization rates, capacity allocations, and venue occupancy metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="hover:border-primary/40 transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-2 rounded-xl`}>{card.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Utilization Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Room Utilization & Capacity Load</CardTitle>
            <CardDescription>Computed weekly period loads vs. 50 available time slots</CardDescription>
          </div>
          <Badge variant="outline">{utilization.length} venues analyzed</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue Identifier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Allocated Slots</TableHead>
                <TableHead className="w-60">Utilization Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilization.map((room, index) => {
                const pct = room.utilization_percentage || 0;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-semibold text-foreground">
                      {room.room_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          room.room_type === 'Lab'
                            ? 'lab'
                            : room.room_type === 'Lecture Hall'
                            ? 'theory'
                            : 'secondary'
                        }
                      >
                        {room.room_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {room.capacity} seats
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {room.slots_used} periods
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              pct > 70
                                ? 'bg-emerald-500'
                                : pct > 30
                                ? 'bg-primary'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-12 text-right">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
