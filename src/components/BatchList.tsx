import React, { useEffect, useState } from 'react';
import {
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  fetchBatchImpact,
  fetchDepartments,
  Department,
} from '../lib/api';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react';
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

interface Batch {
  batch_id: string;
  year_of_study: number;
  section: string;
  student_count: number;
  dept_id: number;
  dept_name?: string;
}

export default function BatchList() {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Form
  const [form, setForm] = useState({
    batch_id: '',
    year_of_study: '1',
    section: 'A',
    student_count: '',
    dept_id: '1',
  });
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState({
    year_of_study: '1',
    section: 'A',
    student_count: '',
    dept_id: '1',
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchData, deptData] = await Promise.all([
        fetchBatches(),
        fetchDepartments(),
      ]);
      setBatches(batchData);
      setDepartments(deptData);
      if (deptData.length > 0 && !form.dept_id) {
        setForm((f) => ({ ...f, dept_id: deptData[0].dept_id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCreating(true);
    try {
      await createBatch({
        batch_id: parseInt(form.batch_id),
        year_of_study: parseInt(form.year_of_study),
        section: form.section.trim().toUpperCase(),
        student_count: parseInt(form.student_count),
        dept_id: parseInt(form.dept_id),
      });
      setSuccessMsg('Batch created successfully!');
      setForm({
        batch_id: '',
        year_of_study: '1',
        section: 'A',
        student_count: '',
        dept_id: departments[0]?.dept_id.toString() || '1',
      });
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
      await updateBatch(editTarget.batch_id, {
        year_of_study: parseInt(editForm.year_of_study),
        section: editForm.section.trim().toUpperCase(),
        student_count: parseInt(editForm.student_count),
        dept_id: parseInt(editForm.dept_id),
      });
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update batch');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteBatch(deleteTarget.batch_id.toString());
    await loadData();
  };

  const filteredBatches = batches.filter((batch) => {
    return (
      batch.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.year_of_study.toString().includes(searchQuery) ||
      (batch.dept_name && batch.dept_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      batch.batch_id.toString().includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Student Cohorts & Batches
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic batches, student headcounts, and departmental affiliations
          </p>
        </div>

        {isCoordinator ? (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel Form' : 'Add New Batch'}
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Viewer Mode — Read-Only</span>
          </Badge>
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
            <CardTitle className="text-base text-foreground">Create New Academic Batch</CardTitle>
            <CardDescription>
              Assign unique identifier, curricular year, section, and total registered students
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

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label htmlFor="batch-id">Batch ID (Numeric)</Label>
                <Input
                  id="batch-id"
                  required
                  type="number"
                  placeholder="e.g. 204"
                  value={form.batch_id}
                  onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="year-study">Year of Study</Label>
                <Select
                  value={form.year_of_study}
                  onValueChange={(val) => setForm({ ...form, year_of_study: val })}
                >
                  <SelectTrigger id="year-study">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="batch-section">Section</Label>
                <Input
                  id="batch-section"
                  required
                  maxLength={1}
                  placeholder="e.g. A"
                  className="uppercase font-semibold"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <Label htmlFor="student-count">Student Count</Label>
                <Input
                  id="student-count"
                  required
                  min="1"
                  type="number"
                  placeholder="e.g. 60"
                  value={form.student_count}
                  onChange={(e) => setForm({ ...form, student_count: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dept-select">Department</Label>
                <Select
                  value={form.dept_id}
                  onValueChange={(val) => setForm({ ...form, dept_id: val })}
                >
                  <SelectTrigger id="dept-select">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                        {d.dept_name} (ID: {d.dept_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-5 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Batch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Directory Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Batch Directory</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search batch/dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-48 text-xs"
              />
            </div>
            <Badge variant="outline">{filteredBatches.length} batches</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm font-medium">Loading batch directory...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Year of Study</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Registered Students</TableHead>
                  <TableHead>Academic Department</TableHead>
                  {isCoordinator && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.batch_id}>
                      <TableCell className="font-semibold text-foreground">
                        #{batch.batch_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Year {batch.year_of_study}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        Sec {batch.section}
                      </TableCell>
                      <TableCell className="font-medium text-foreground/80">
                        {batch.student_count} Students
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {batch.dept_name || `Department #${batch.dept_id}`}
                      </TableCell>
                      {isCoordinator && (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 mr-1"
                            onClick={() => {
                              setEditTarget(batch);
                              setEditForm({
                                year_of_study: batch.year_of_study.toString(),
                                section: batch.section,
                                student_count: batch.student_count.toString(),
                                dept_id: batch.dept_id.toString(),
                              });
                              setEditError('');
                            }}
                            title="Edit Batch"
                          >
                            <Pencil className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(batch)}
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isCoordinator ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No student cohorts match your search query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Batch Dialog */}
      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle>Edit Batch #{editTarget.batch_id}</DialogTitle>
                  <DialogDescription>Modify cohort configuration, section, and enrolled headcount</DialogDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-batch-id">Batch ID (Locked)</Label>
                  <Input
                    id="edit-batch-id"
                    disabled
                    value={editTarget.batch_id}
                    className="bg-muted cursor-not-allowed font-semibold text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dept-id">Department</Label>
                  <Select
                    value={editForm.dept_id}
                    onValueChange={(val) => setEditForm({ ...editForm, dept_id: val })}
                  >
                    <SelectTrigger id="edit-dept-id">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.dept_id} value={d.dept_id.toString()}>
                          {d.dept_name} (ID: {d.dept_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="edit-year">Year of Study</Label>
                  <Select
                    value={editForm.year_of_study}
                    onValueChange={(val) => setEditForm({ ...editForm, year_of_study: val })}
                  >
                    <SelectTrigger id="edit-year">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-section">Section</Label>
                  <Input
                    id="edit-section"
                    required
                    maxLength={1}
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                    className="uppercase font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-student-count">Student Count</Label>
                  <Input
                    id="edit-student-count"
                    required
                    min="1"
                    type="number"
                    value={editForm.student_count}
                    onChange={(e) => setEditForm({ ...editForm, student_count: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Note: Database triggers enforce that student count does not exceed room capacity in existing scheduled slots.
              </p>

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
          title="Delete Batch"
          itemName={`Batch ${deleteTarget.batch_id} (Year ${deleteTarget.year_of_study}-${deleteTarget.section})`}
          itemType="batch"
          fetchImpact={() => fetchBatchImpact(deleteTarget.batch_id)}
        />
      )}
    </div>
  );
}
