import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Info } from 'lucide-react';

export interface ImpactData {
  courses_count?: number;
  batches_count?: number;
  schedules_count?: number;
}

interface CascadeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: 'department' | 'course' | 'room' | 'batch';
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

  if (!isOpen) return null;

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
      (impact.schedules_count && impact.schedules_count > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Cascade Deletion Impact Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-white">"{itemName}"</span>?
          </p>

          {loadingImpact && (
            <div className="flex items-center justify-center space-x-2 py-6 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span>Analyzing database dependencies & active schedules...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loadingImpact && impact && (
            <div>
              {hasCascadeImpact ? (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-red-400 font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warning: Foreign Key Cascade Impact</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Deleting this {itemType} will permanently remove the following linked records from the database:
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {impact.courses_count !== undefined && (
                      <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-red-400">{impact.courses_count}</div>
                        <div className="text-[11px] text-slate-400">Courses</div>
                      </div>
                    )}
                    {impact.batches_count !== undefined && (
                      <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-red-400">{impact.batches_count}</div>
                        <div className="text-[11px] text-slate-400">Batches</div>
                      </div>
                    )}
                    {impact.schedules_count !== undefined && (
                      <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-lg text-center">
                        <div className="text-lg font-bold text-red-400">{impact.schedules_count}</div>
                        <div className="text-[11px] text-slate-400">Active Schedules</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>No active schedules or dependent records are attached. Safe to remove.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting || loadingImpact}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
