import React, { useState, useRef } from 'react';
import { usePMS } from '../context/PMSContext';
import {
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  FileJson,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

export const BackupRestoreModal: React.FC = () => {
  const {
    isBackupModalOpen,
    setIsBackupModalOpen,
    rooms,
    bookings,
    pastPayments,
    downloadBackup,
    restoreFromBackup,
    lastSyncTime,
  } = usePMS();

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackupModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Please select a valid .json backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !Array.isArray(parsed.rooms)) {
          setErrorMessage('Invalid backup file format: Missing rooms list.');
          setPreviewData(null);
          return;
        }

        setPreviewData(parsed);
      } catch (err: any) {
        setErrorMessage('Failed to read file: ' + (err.message || 'Invalid JSON syntax'));
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!previewData) return;
    setIsRestoring(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await restoreFromBackup(previewData);
    setIsRestoring(false);

    if (result.success) {
      setSuccessMessage(result.message);
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setErrorMessage(result.message);
    }
  };

  const counts = {
    totalRooms: rooms.length,
    activeBookings: bookings.filter((b) => b.status === 'ACTIVE').length,
    reservedBookings: bookings.filter((b) => b.status === 'RESERVED').length,
    completedBookings: bookings.filter((b) => b.status === 'COMPLETED').length,
    totalPayments: pastPayments.length + bookings.reduce((sum, b) => sum + (b.payments?.length || 0), 0),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col text-stone-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Backup & Data Preservation</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Safe Vault
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Sri Bhavani Vasavi Bhavan • Tiruvannamalai
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Automatic Self-Healing Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 to-stone-900 border border-emerald-800/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-300 space-y-1">
              <p className="font-semibold text-emerald-300">
                Automatic Self-Healing Client Vault Active
              </p>
              <p className="text-stone-400 leading-relaxed">
                All bookings, payments, and room statuses are safely preserved on your computer. Even if Render sleeps, restarts, or updates, your data will auto-restore automatically upon opening.
              </p>
            </div>
          </div>

          {/* Current Live Database Snapshot Card */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Current System Records
              </span>
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-500" />
                {lastSyncTime ? lastSyncTime.toLocaleTimeString('en-IN') : 'Synced'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <div className="text-base font-bold text-white">{counts.totalRooms}</div>
                <div className="text-[10px] text-stone-400 uppercase">Rooms</div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <div className="text-base font-bold text-emerald-400">{counts.activeBookings}</div>
                <div className="text-[10px] text-stone-400 uppercase">Checked In</div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <div className="text-base font-bold text-amber-400">{counts.reservedBookings}</div>
                <div className="text-[10px] text-stone-400 uppercase">Future Reserved</div>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <div className="text-base font-bold text-cyan-400">{counts.totalPayments}</div>
                <div className="text-[10px] text-stone-400 uppercase">Payment Logs</div>
              </div>
            </div>
          </div>

          {/* Action 1: Download Backup */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                1-Click Download Backup
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Download a timestamped <span className="font-mono text-amber-300">.json</span> file to your PC or pen drive.
              </p>
            </div>
            <button
              onClick={downloadBackup}
              id="btn-download-pms-backup"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-white text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup</span>
            </button>
          </div>

          {/* Action 2: Restore from Backup */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Restore from Backup File
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Select a previously saved backup file to restore all rooms, bookings, and receipts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700 cursor-pointer border border-stone-800 rounded-lg bg-stone-900/80"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Preview of selected backup */}
            {previewData && (
              <div className="p-3.5 rounded-lg bg-stone-900 border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4" />
                    Backup Preview Validated
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Exported: {previewData.exportedAt ? new Date(previewData.exportedAt).toLocaleDateString('en-IN') : 'Unknown'}
                  </span>
                </div>
                <div className="text-xs text-stone-300">
                  Contains:{' '}
                  <span className="font-semibold text-white">
                    {previewData.rooms?.length || 0} rooms
                  </span>
                  ,{' '}
                  <span className="font-semibold text-white">
                    {previewData.bookings?.length || 0} bookings
                  </span>
                  , and{' '}
                  <span className="font-semibold text-white">
                    {previewData.pastPayments?.length || 0} payments
                  </span>
                  .
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    id="btn-confirm-restore-backup"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Restoring Data...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Restore This Backup</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPreviewData(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-end">
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
