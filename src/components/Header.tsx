import React, { useState, useEffect } from 'react';
import { usePMS } from '../context/PMSContext';
import { LODGE_DETAILS } from '../data/seedData';
import { AdminResetModal } from './AdminResetModal';
import {
  Building2,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  Receipt,
  BedDouble,
  AlertCircle,
  CheckCircle2,
  Wrench,
  RefreshCw,
  Lock,
  CalendarCheck,
  HardDrive,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    rooms,
    bookings,
    selectedStatus,
    setSelectedStatus,
    isSynced,
    isCloudDatabaseConnected,
    syncNow,
    setIsDailyLedgerOpen,
    setIsReservationsModalOpen,
    setIsBlueprintOpen,
    setIsBackupModalOpen,
    resetToSampleData,
  } = usePMS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const counts = {
    available: rooms.filter((r) => r.status === 'AVAILABLE').length,
    occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
    cleaning: rooms.filter((r) => r.status === 'CLEANING_NEEDED').length,
    maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
  };

  const occupancyPercent = Math.round((counts.occupied / 11) * 100);

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md sticky top-0 z-30">
      {/* Top Banner with Property Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Address */}
          <div className="flex items-start gap-3">
            <div className="p-1 bg-white rounded-xl border border-amber-400/40 shrink-0 flex items-center justify-center overflow-hidden w-16 h-14 shadow-sm">
              {!logoError ? (
                <img
                  src="/logo/bhavani-residency-logo-bg-removed.png"
                  alt={LODGE_DETAILS.name}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-7 h-7 text-amber-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif-title">
                  {LODGE_DETAILS.name}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                  Tiruvannamalai
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-stone-800 text-stone-200 border border-stone-700 rounded-md">
                  11 Rooms Total (Ground: 6 • First: 5)
                </span>
              </div>
              <p className="text-xs text-stone-400 line-clamp-1 max-w-2xl mt-0.5">
                {LODGE_DETAILS.address} • Front Desk: {LODGE_DETAILS.phone.split('/')[0]}
              </p>
            </div>
          </div>

          {/* Right Action Controls & Clock */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            {/* Real-time Multi-Device Sync Indicator */}
            <button
              id="btn-multi-device-sync"
              onClick={() => syncNow()}
              title={
                isCloudDatabaseConnected
                  ? 'MongoDB Atlas Cloud Database Connected: All bookings and ledgers are permanently saved in the cloud.'
                  : 'Syncing across devices. Connect MONGODB_URI on Render for permanent cloud persistence.'
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-800/90 hover:bg-stone-800 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudDatabaseConnected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : isSynced
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="hidden md:inline">
                {isCloudDatabaseConnected
                  ? 'MongoDB Cloud Active'
                  : isSynced
                  ? 'Multi-Device Synced'
                  : 'Syncing...'}
              </span>
              <RefreshCw className="w-3 h-3 text-stone-400" />
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60 text-stone-300 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentTime.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                })}
                ,{' '}
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>

            <button
              id="btn-reservations-modal"
              onClick={() => setIsReservationsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700/90 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
              title="View Advance Reservations & Future Bookings"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Reservations</span>
              {bookings.filter((b) => b.status === 'RESERVED').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-300 text-amber-950">
                  {bookings.filter((b) => b.status === 'RESERVED').length}
                </span>
              )}
            </button>

            <button
              id="btn-daily-ledger"
              onClick={() => setIsDailyLedgerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
              title="View Daily Collections & Housekeeping Ledger"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Daily Ledger</span>
            </button>

            <button
              id="btn-backup-restore-modal"
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-emerald-500/50 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Download Data Backup or Restore System Records"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup</span>
            </button>

            <button
              id="btn-blueprint-docs"
              onClick={() => setIsBlueprintOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium rounded-lg transition-colors"
              title="View SQL DDL Schema & REST API Specifications"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Schema & APIs</span>
            </button>

            <button
              id="btn-reset-sample"
              onClick={() => setIsAdminResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs rounded-lg transition-colors"
              title="Administrator System Reset (Password Protected)"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Clickable Live Operational Counters Bar to View Separately */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-stone-800/80 text-xs">
          {/* Available Button */}
          <button
            id="btn-header-filter-available"
            onClick={() => setSelectedStatus(selectedStatus === 'AVAILABLE' ? 'all' : 'AVAILABLE')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              selectedStatus === 'AVAILABLE'
                ? 'bg-emerald-950 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/40 shadow-sm'
                : 'bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-800/40 text-emerald-300'
            }`}
            title="Click to view only Available rooms (Click again to show all)"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Available</span>
              {selectedStatus === 'AVAILABLE' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/60 px-1 rounded text-emerald-200 ml-1">
                  Active
                </span>
              )}
            </span>
            <span className="font-bold text-sm text-emerald-200">{counts.available}</span>
          </button>

          {/* Occupied Button */}
          <button
            id="btn-header-filter-occupied"
            onClick={() => setSelectedStatus(selectedStatus === 'OCCUPIED' ? 'all' : 'OCCUPIED')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              selectedStatus === 'OCCUPIED'
                ? 'bg-rose-950 border-rose-400 text-rose-100 ring-2 ring-rose-400/40 shadow-sm'
                : 'bg-rose-950/40 hover:bg-rose-950/70 border-rose-800/40 text-rose-300'
            }`}
            title="Click to view only Occupied rooms (Click again to show all)"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <BedDouble className="w-3.5 h-3.5 text-rose-400" />
              <span>Occupied</span>
              {selectedStatus === 'OCCUPIED' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-700/60 px-1 rounded text-rose-200 ml-1">
                  Active
                </span>
              )}
            </span>
            <span className="font-bold text-sm text-rose-200">{counts.occupied}</span>
          </button>

          {/* Cleaning Needed Button */}
          <button
            id="btn-header-filter-cleaning"
            onClick={() => setSelectedStatus(selectedStatus === 'CLEANING_NEEDED' ? 'all' : 'CLEANING_NEEDED')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              selectedStatus === 'CLEANING_NEEDED'
                ? 'bg-amber-950 border-amber-400 text-amber-100 ring-2 ring-amber-400/40 shadow-sm'
                : 'bg-amber-950/40 hover:bg-amber-950/70 border-amber-800/40 text-amber-300'
            }`}
            title="Click to view only Cleaning Needed rooms (Click again to show all)"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cleaning</span>
              {selectedStatus === 'CLEANING_NEEDED' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-700/60 px-1 rounded text-amber-200 ml-1">
                  Active
                </span>
              )}
            </span>
            <span className="font-bold text-sm text-amber-200">{counts.cleaning}</span>
          </button>

          {/* Blocked / Maintenance Button */}
          <button
            id="btn-header-filter-blocked"
            onClick={() => setSelectedStatus(selectedStatus === 'MAINTENANCE' ? 'all' : 'MAINTENANCE')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              selectedStatus === 'MAINTENANCE'
                ? 'bg-stone-800 border-stone-300 text-stone-100 ring-2 ring-stone-400/40 shadow-sm'
                : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
            }`}
            title="Click to view only Blocked / Maintenance rooms (Click again to show all)"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Wrench className="w-3.5 h-3.5 text-stone-400" />
              <span>Blocked</span>
              {selectedStatus === 'MAINTENANCE' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-600/80 px-1 rounded text-stone-200 ml-1">
                  Active
                </span>
              )}
            </span>
            <span className="font-bold text-sm text-stone-200">{counts.maintenance}</span>
          </button>

          {/* Occupancy Rate / Reset All Button */}
          <button
            id="btn-header-filter-occupancy"
            onClick={() => setSelectedStatus('all')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              selectedStatus === 'all'
                ? 'bg-stone-800 border-amber-500/60 text-stone-100 ring-1 ring-amber-500/30 shadow-sm'
                : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700 text-stone-300'
            }`}
            title="Click to reset filters and view All 11 Rooms & total occupancy"
          >
            <span className="flex items-center gap-1.5 text-stone-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Occupancy</span>
              {selectedStatus === 'all' && (
                <span className="text-[10px] font-bold text-stone-400 bg-stone-900 px-1 rounded ml-0.5">
                  All
                </span>
              )}
            </span>
            <span className="font-bold text-sm text-amber-400">{occupancyPercent}%</span>
          </button>
        </div>
      </div>

      {/* Password-Protected Administrator Master Reset Modal */}
      <AdminResetModal
        isOpen={isAdminResetOpen}
        onClose={() => setIsAdminResetOpen(false)}
        onConfirm={resetToSampleData}
      />
    </header>
  );
};
