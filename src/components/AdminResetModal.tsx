import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface AdminResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  actionButtonLabel?: string;
}

const ADMIN_PASSWORD = 'Gvminfotech!@#@14356789';

export const AdminResetModal: React.FC<AdminResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Administrator Reset Authorization',
  subtitle = 'Password protected security clearance',
  description = 'Resetting will re-initialize all 11 rooms, active check-in occupancies, and operational data back to baseline sample data. To proceed, please enter the administrator security password.',
  actionButtonLabel = 'Verify & Reset System',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.trim() === ADMIN_PASSWORD) {
      setIsSubmitting(true);
      try {
        onConfirm();
        setPassword('');
        setIsSubmitting(false);
        onClose();
      } catch {
        setIsSubmitting(false);
        setErrorMessage('Failed to execute reset. Please try again.');
      }
    } else {
      setErrorMessage('Incorrect administrator password. Authorization failed.');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="admin-reset-modal-backdrop"
      className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
    >
      <div
        id="admin-reset-modal-card"
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-rose-950 text-white flex items-start justify-between border-b border-rose-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-800/80 rounded-xl border border-rose-700 text-rose-200">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              <p className="text-xs text-rose-300 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-950 space-y-1">
            <p className="font-bold text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              Critical Operational Action
            </p>
            <p className="text-stone-700 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800">
              Administrator Master Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="input-admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter password to confirm reset"
                autoFocus
                className={`w-full pl-9 pr-10 py-2.5 text-sm bg-stone-50 border rounded-xl focus:outline-hidden focus:ring-2 focus:bg-white text-stone-900 ${
                  errorMessage
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-stone-300 focus:ring-stone-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-admin-reset"
              type="submit"
              disabled={isSubmitting || !password}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-xs ${
                !password
                  ? 'bg-stone-400 cursor-not-allowed'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isSubmitting ? 'Verifying...' : actionButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
