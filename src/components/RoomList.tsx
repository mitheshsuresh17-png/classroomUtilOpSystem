import React, { useEffect, useState } from 'react';
import {
  fetchRooms,
  fetchFreeRooms,
  fetchTimeSlots,
  fetchSchedules,
  createRoom,
  updateRoom,
  deleteRoom,
  fetchRoomImpact,
} from '../lib/api';
import {
  Filter,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import TimeSlotGrid, { TimeSlot } from './TimeSlotGrid';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

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
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [editForm, setEditForm] = useState({ room_type: 'Classroom', capacity: '' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cascade Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, sData, slotData] = await Promise.all([
        showFreeOnly ? fetchFreeRooms() : fetchRooms(),
        fetchSchedules(),
        fetchTimeSlots(),
      ]);
      setRooms(rData);
      setSchedules(sData);
      setSlots(slotData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showFreeOnly]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreating(true);
    try {
      await createRoom({ ...form, capacity: parseInt(form.capacity) });
      setSuccessMsg('Room created successfully!');
      setForm({ room_number: '', room_type: 'Classroom', capacity: '' });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setCreating(false);
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
        capacity: parseInt(editForm.capacity),
      });
      setEditTarget(null);
      await loadData();
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

  const filteredRooms = rooms.filter((r) => {
    if (searchQuery && !r.room_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter && r.room_type !== typeFilter) return false;
    if (minCap && r.capacity < parseInt(minCap)) return false;
    if (maxCap && r.capacity > parseInt(maxCap)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Classrooms & Laboratories
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic venues, physical capacities, and occupancy matrices
          </p>
        </div>

        {isCoordinator && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel Form' : 'Add New Room'}
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <Alert variant="success" className="animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Creation Drawer / Card */}
      {showForm && (
        <Card className="animate-fade-up border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Create New Venue</CardTitle>
            <CardDescription>
              Assign room code, functional room type, and seating capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="room-number">Room Number / Identifier</Label>
                <Input
                  id="room-number"
                  required
                  placeholder="e.g. CS101, L204"
                  value={form.room_number}
                  onChange={(e) => setForm({ ...form, room_number: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <Label htmlFor="room-type">Room Type</Label>
                <Select
                  value={form.room_type}
                  onValueChange={(val) => setForm({ ...form, room_type: val })}
                >
                  <SelectTrigger id="room-type">
                    <SelectValue placeholder="Select Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="room-cap">Seating Capacity</Label>
                <Input
                  id="room-cap"
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 60"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Venue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Filter & Venue Discovery</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Find room..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type */}
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
              <SelectTrigger>
                <SelectValue placeholder="All Venue Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Venue Types</SelectItem>
                <SelectItem value="Classroom">Classroom</SelectItem>
                <SelectItem value="Lab">Lab</SelectItem>
                <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
              </SelectContent>
            </Select>

            {/* Min/Max Capacity */}
            <div className="flex rounded-md border border-input overflow-hidden bg-background">
              <input
                type="number"
                placeholder="Min Cap"
                className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground"
                value={minCap}
                onChange={(e) => setMinCap(e.target.value)}
              />
              <div className="border-l border-input" />
              <input
                type="number"
                placeholder="Max Cap"
                className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground"
                value={maxCap}
                onChange={(e) => setMaxCap(e.target.value)}
              />
            </div>

            {/* EXCEPT Toggle */}
            <div className="lg:col-span-2 flex items-center bg-accent/40 border border-border px-4 py-2 rounded-lg">
              <label className="flex items-center cursor-pointer w-full justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-semibold text-foreground">Completely Free Venues Only</span>
                  <span className="text-[11px] text-muted-foreground">Uses SQL EXCEPT / NOT IN Subquery</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showFreeOnly}
                    onChange={(e) => setShowFreeOnly(e.target.checked)}
                  />
                  <div
                    className={`block w-10 h-6 rounded-full transition-colors ${
                      showFreeOnly ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                  <div
                    className={`dot absolute left-1 top-1 bg-background w-4 h-4 rounded-full transition-transform shadow-sm ${
                      showFreeOnly ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Directory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Directory Results</CardTitle>
          </div>
          <Badge variant="outline">{filteredRooms.length} rooms listed</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm font-medium">Loading venue directory...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Identifier</TableHead>
                  <TableHead>Venue Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-center">Active Bookings</TableHead>
                  {isCoordinator && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => {
                    const isExpanded = expandedRoomId === room.room_number;
                    const roomSchedules = schedules.filter((s) => s.room_number === room.room_number);
                    const bookedSlotIds = roomSchedules
                      .map((sched) => {
                        const matchingSlot = slots.find(
                          (s) => s.day_of_week === sched.day_of_week && s.start_time === sched.start_time
                        );
                        return matchingSlot ? matchingSlot.slot_id.toString() : null;
                      })
                      .filter(Boolean) as string[];

                    return (
                      <React.Fragment key={room.room_number}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedRoomId(isExpanded ? null : room.room_number)}
                        >
                          <TableCell className="font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-primary" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span>{room.room_number}</span>
                            </div>
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
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-normal text-xs">
                              {roomSchedules.length} periods booked
                            </Badge>
                          </TableCell>
                          {isCoordinator && (
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTarget(room);
                                  setEditForm({
                                    room_type: room.room_type,
                                    capacity: room.capacity.toString(),
                                  });
                                  setEditError('');
                                }}
                                title="Edit Room"
                              >
                                <Pencil className="w-4 h-4 text-primary" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(room);
                                }}
                                title="Delete Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={isCoordinator ? 5 : 4} className="p-4">
                              <div className="space-y-3 animate-fade-up">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Weekly Occupancy Grid: Room {room.room_number}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    Click any cell or header to view booking details
                                  </span>
                                </div>
                                <TimeSlotGrid
                                  mode="view"
                                  slots={slots}
                                  bookedSlotIds={bookedSlotIds}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isCoordinator ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No venues match your filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle>Edit Room {editTarget.room_number}</DialogTitle>
                  <DialogDescription>Update room classification and capacity ceiling</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="edit-room-number">Room Identifier (Locked)</Label>
                <Input
                  id="edit-room-number"
                  disabled
                  value={editTarget.room_number}
                  className="bg-muted cursor-not-allowed font-semibold text-muted-foreground"
                />
              </div>

              <div>
                <Label htmlFor="edit-room-type">Room Type</Label>
                <Select
                  value={editForm.room_type}
                  onValueChange={(val) => setEditForm({ ...editForm, room_type: val })}
                >
                  <SelectTrigger id="edit-room-type">
                    <SelectValue placeholder="Select Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Classroom">Classroom</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-room-cap">Capacity (Seats)</Label>
                <Input
                  id="edit-room-cap"
                  required
                  type="number"
                  min="1"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Note: Database trigger prevents lowering capacity below existing scheduled batch size.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Cascade Delete Modal */}
      {deleteTarget && (
        <CascadeDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Venue"
          itemName={`Room ${deleteTarget.room_number} (${deleteTarget.room_type})`}
          itemType="room"
          fetchImpact={() => fetchRoomImpact(deleteTarget.room_number)}
        />
      )}
    </div>
  );
}
