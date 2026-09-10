import React, { useState, useEffect } from 'react';
import { usePMS } from '../context/PMSContext';
import {
  X,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
  Brush,
  Lock,
} from 'lucide-react';

const COMMON_REASONS = [
  { label: 'AC Repair / Gas Refill / Servicing', icon: Flame },
  { label: 'Plumbing / Tap Leakage / Bathroom Issue', icon: Droplets },
  { label: 'Electrical / Geyser / Power Switch Work', icon: Zap },
  { label: 'Painting / Wall Patch / Carpentry Repair', icon: Brush },
  { label: 'Deep Sanitation & Pest Control', icon: AlertTriangle },
  { label: 'Owner Reserved / VIP Pilgrimage Hold', icon: Lock },
];

export const BlockRoomModal: React.FC = () => {
  const { blockRoomTarget, setBlockRoomTarget, blockRoom, unblockRoom, rooms } = usePMS();

  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0].label);
  const [customReason, setCustomReason] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (blockRoomTarget?.maintenanceReason) {
      setCustomReason(blockRoomTarget.maintenanceReason);
      setIsCustom(true);
    } else {
      setSelectedReason(COMMON_REASONS[0].label);
      setCustomReason('');
      setIsCustom(false);
    }
  }, [blockRoomTarget]);

  if (!blockRoomTarget) return null;

  const currentRoom = rooms.find((r) => r.id === blockRoomTarget.id) || blockRoomTarget;
  const isCurrentlyBlocked = currentRoom.status === 'MAINTENANCE';

  const handleConfirmBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = isCustom && customReason.trim() ? customReason.trim() : selectedReason;
    blockRoom(currentRoom.id, finalReason);
  };

  const handleUnblock = () => {
    unblockRoom(currentRoom.id);
  };

  return (
    <div
      id="modal-block-room-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setBlockRoomTarget(null)}
    >
      <div
        id="modal-block-room-content"
        className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 text-stone-300 rounded-lg border border-stone-700">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isCurrentlyBlocked ? 'Manage Blocked Room' : 'Block Room for Maintenance'}
              </h2>
              <p className="text-xs text-stone-400">
                Room <strong className="text-white">{currentRoom.number}</strong> • {currentRoom.floor}
              </p>
            </div>
          </div>
          <button
            onClick={() => setBlockRoomTarget(null)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form or Unblock View */}
        {isCurrentlyBlocked ? (
          <div className="p-6 space-y-5">
            <div className="bg-stone-100 border border-stone-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-stone-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Room {currentRoom.number} is currently BLOCKED
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    <strong>Logged Reason:</strong> {currentRoom.maintenanceReason || 'General Maintenance'}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Blocked rooms are excluded from guest check-in availability until marked resolved.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setBlockRoomTarget(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              <button
                id="btn-unblock-room-confirm"
                type="button"
                onClick={handleUnblock}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Resolve & Make Available
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBlock} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Select Reason for Blocking Room {currentRoom.number}
              </label>

              <div className="space-y-2">
                {COMMON_REASONS.map((r) => {
                  const Icon = r.icon;
                  const isSelected = !isCustom && selectedReason === r.label;
                  return (
                    <button
                      type="button"
                      key={r.label}
                      onClick={() => {
                        setSelectedReason(r.label);
                        setIsCustom(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex items-center gap-3 transition-colors ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}

                {/* Custom Reason Option */}
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex items-center gap-3 transition-colors ${
                    isCustom
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Wrench className={`w-4 h-4 shrink-0 ${isCustom ? 'text-amber-400' : 'text-stone-500'}`} />
                  <span>Other / Custom Operational Reason</span>
                </button>
              </div>

              {isCustom && (
                <div className="mt-3">
                  <input
                    id="input-custom-block-reason"
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter specific maintenance note (e.g. Geyser coil replacement)"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-stone-900 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Operational Impact:</strong> Once blocked, Room {currentRoom.number} will show in
                the Room Grid as blocked/maintenance so receptionists avoid assigning it to arriving guests.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setBlockRoomTarget(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-block-submit"
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                Confirm & Block Room {currentRoom.number}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
