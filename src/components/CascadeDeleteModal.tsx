import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export interface ImpactData {
  courses_count?: number;
  batches_count?: number;
  faculty_count?: number;
  schedules_count?: number;
}

interface CascadeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: 'department' | 'course' | 'room' | 'batch' | 'faculty';
  fetchImpact: () => Promise<ImpactData>;
}

export const CascadeDeleteModal: React.FC<CascadeDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  fetchImpact,
}) => {
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingImpact(true);
      setError(null);
      fetchImpact()
        .then((data) => setImpact(data))
        .catch((err) => setError(err.message || 'Failed to analyze deletion impact'))
        .finally(() => setLoadingImpact(false));
    } else {
      setImpact(null);
      setError(null);
      setDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const hasCascadeImpact =
    impact &&
    ((impact.courses_count && impact.courses_count > 0) ||
      (impact.batches_count && impact.batches_count > 0) ||
      (impact.faculty_count && impact.faculty_count > 0) ||
      (impact.schedules_count && impact.schedules_count > 0));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg text-foreground">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cascade Deletion Impact Assessment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-foreground/80">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{itemName}"</span>?
          </p>

          {loadingImpact && (
            <div className="flex items-center justify-center space-x-2 py-6 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Analyzing database dependencies & active schedules...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loadingImpact && impact && (
            <div>
              {hasCascadeImpact ? (
                <div className="p-4 bg-destructive/10 border border-destructive/25 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-destructive font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warning: Foreign Key Cascade Impact</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deleting this {itemType} will permanently remove the following linked records from the database:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {impact.courses_count !== undefined && (
                      <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-destructive">{impact.courses_count}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">Courses</div>
                      </div>
                    )}
                    {impact.batches_count !== undefined && (
                      <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-destructive">{impact.batches_count}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">Batches</div>
                      </div>
                    )}
                    {impact.faculty_count !== undefined && (
                      <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-destructive">{impact.faculty_count}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">Faculty</div>
                      </div>
                    )}
                    {impact.schedules_count !== undefined && (
                      <div className="bg-background border border-border p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-destructive">{impact.schedules_count}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">Schedules</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="success">
                  <Info className="w-4 h-4" />
                  <AlertTitle>Safe to Delete</AlertTitle>
                  <AlertDescription>
                    No active schedules or dependent records are attached to this {itemType}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting || loadingImpact}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
