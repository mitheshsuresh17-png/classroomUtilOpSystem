import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Users,
  Lock,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';
import {
  fetchDepartments,
  createDepartment,
  deleteDepartment,
  fetchDepartmentImpact,
  Department,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CascadeDeleteModal } from './CascadeDeleteModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
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

export const DepartmentList: React.FC = () => {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err: any) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptId || !newDeptName.trim()) {
      setFormError('Both Department ID and Name are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await createDepartment({
        dept_id: parseInt(newDeptId, 10),
        dept_name: newDeptName.trim(),
      });
      setIsAddModalOpen(false);
      setNewDeptId('');
      setNewDeptName('');
      await loadDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDepartment(deleteTarget.dept_id);
    await loadDepartments();
  };

  const filtered = departments.filter(
    (d) =>
      d.dept_name.toLowerCase().includes(search.toLowerCase()) ||
      d.dept_id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Academic Departments
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage academic divisions, affiliated programs, faculty, and student batches
          </p>
        </div>

        {isCoordinator ? (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Viewer Mode — Read-Only</span>
          </Badge>
        )}
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search departments by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <Badge variant="outline">{filtered.length} departments active</Badge>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="font-medium text-sm">Loading academic departments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-base font-semibold text-foreground">No departments found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or add a new department
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dept) => (
            <Card
              key={dept.dept_id}
              className="hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      #{dept.dept_id}
                    </div>
                    <div>
                      <CardTitle className="text-base leading-snug">{dept.dept_name}</CardTitle>
                      <CardDescription>Department ID: {dept.dept_id}</CardDescription>
                    </div>
                  </div>
                  {isCoordinator && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(dept)}
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{dept.total_courses || 0} Courses</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground font-medium">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{dept.total_batches || 0} Batches</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Department Dialog */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && setIsAddModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle>Add Academic Department</DialogTitle>
                  <DialogDescription>Register a new department in the university registry</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleAddDepartment} className="space-y-4 py-2">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="add-dept-id">Department ID (Numeric)</Label>
                <Input
                  id="add-dept-id"
                  type="number"
                  required
                  placeholder="e.g. 5"
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="add-dept-name">Department Name</Label>
                <Input
                  id="add-dept-name"
                  type="text"
                  required
                  placeholder="e.g. Electrical & Electronics Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Register Department
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
          onConfirm={handleDelete}
          title="Delete Department"
          itemName={deleteTarget.dept_name}
          itemType="department"
          fetchImpact={() => fetchDepartmentImpact(deleteTarget.dept_id)}
        />
      )}
    </div>
  );
};
