import React, { useState } from 'react';
import { usePMS } from '../context/PMSContext';
import { PaymentMethod } from '../types';
import { calculateBill, formatCurrency, formatDateTime } from '../utils/billing';
import {
  X,
  LogOut,
  IndianRupee,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Receipt,
  Percent,
} from 'lucide-react';

export const CheckOutModal: React.FC = () => {
  const { checkOutBooking, setCheckOutBooking, setInvoiceBooking, checkOut } = usePMS();

  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('Cash');
  const [settlementRef, setSettlementRef] = useState('');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  if (!checkOutBooking) return null;

  const bill = calculateBill({ ...checkOutBooking, gstEnabled });
  const finalBalanceDue = Math.max(0, bill.balanceDue - discountAmount);

  const handleCompleteCheckOut = (e: React.FormEvent) => {
    e.preventDefault();

    const completedBooking = checkOut({
      bookingId: checkOutBooking.id,
      settlementAmount: finalBalanceDue,
      paymentMethod: settlementMethod,
      referenceNumber: settlementRef.trim() || undefined,
      gstEnabled,
    });

    setCheckOutBooking(null);
    // Directly open printable invoice modal
    setInvoiceBooking(completedBooking);
  };

  return (
    <div
      id="modal-checkout-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setCheckOutBooking(null)}
    >
      <div
        id="modal-checkout-content"
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/30 text-rose-400 rounded-lg border border-rose-500/30">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Check-Out Settlement — Room {checkOutBooking.roomNumber}
              </h2>
              <p className="text-xs text-stone-400">
                Guest: <strong className="text-stone-200">{checkOutBooking.guest.fullName}</strong> • Phone: {checkOutBooking.guest.primaryPhone}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCheckOutBooking(null)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCompleteCheckOut} className="p-6 space-y-6 text-xs sm:text-sm">
          {/* Stay & Duration Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Check-In</span>
              <span className="font-semibold text-stone-800">{formatDateTime(checkOutBooking.checkInTime)}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Check-Out (Now)</span>
              <span className="font-semibold text-stone-800">{formatDateTime(new Date().toISOString())}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Cycle Rule</span>
              <span className="font-semibold text-stone-800">
                {checkOutBooking.billingCycleType === '24_HOUR_CYCLE' ? '24-Hour Cycle' : '11:00 AM Standard'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Stay Calculated</span>
              <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded inline-block">
                {bill.durationFormatted}
              </span>
            </div>
          </div>

          {/* Itemized Folio Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-100 px-4 py-2 font-bold text-xs text-stone-800 border-b border-stone-200 flex justify-between items-center">
              <span>Itemized Folio Breakdown</span>
              <span className="text-stone-500 font-normal">Folio: {checkOutBooking.bookingNumber}</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-stone-100 bg-white">
                {/* Room Rent */}
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-stone-900">
                      Room {checkOutBooking.roomNumber} Lodging Tariff
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {bill.daysStayed} Day{bill.daysStayed > 1 ? 's' : ''} × {formatCurrency(bill.tariffPerDay)}
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-stone-900">
                    {formatCurrency(bill.roomRentTotal)}
                  </td>
                </tr>

                {/* Extra Bed / Mattress */}
                {bill.extraBedTotal > 0 && (
                  <tr className="bg-amber-50/40">
                    <td className="p-3">
                      <div className="font-bold text-stone-900">Extra Bed / Mattress</div>
                      <div className="text-[11px] text-stone-500">
                        {checkOutBooking.extraBedCount || 1} Bed × ₹150/day × {bill.daysStayed} Day{bill.daysStayed > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-amber-900">
                      {formatCurrency(bill.extraBedTotal)}
                    </td>
                  </tr>
                )}

                {/* Ancillary Charges */}
                {checkOutBooking.charges?.map((chg) => (
                  <tr key={chg.id}>
                    <td className="p-3">
                      <div className="font-medium text-stone-800">{chg.item}</div>
                      <div className="text-[11px] text-stone-400">
                        {chg.quantity} × {formatCurrency(chg.unitPrice)}
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold text-stone-800">
                      {formatCurrency(chg.totalAmount)}
                    </td>
                  </tr>
                ))}

                {/* Subtotal */}
                <tr className="bg-stone-50 font-semibold text-stone-700">
                  <td className="p-2.5">Subtotal</td>
                  <td className="p-2.5 text-right">{formatCurrency(bill.subtotal)}</td>
                </tr>

                {/* GST Toggle Line */}
                <tr className="bg-white">
                  <td className="p-2.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gstEnabled}
                        onChange={(e) => setGstEnabled(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-stone-800">
                        Apply GST Tax (12% CGST/SGST)
                      </span>
                    </label>
                  </td>
                  <td className="p-2.5 text-right font-medium text-stone-700">
                    {gstEnabled ? formatCurrency(bill.gstAmount) : '₹0'}
                  </td>
                </tr>

                {/* Discount */}
                {discountAmount > 0 && (
                  <tr className="bg-amber-50/50 text-amber-900">
                    <td className="p-2.5 font-medium">Management Discount / Concession</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-700">
                      -{formatCurrency(discountAmount)}
                    </td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr className="bg-stone-100 font-bold text-stone-900 text-sm">
                  <td className="p-3">Grand Total</td>
                  <td className="p-3 text-right">{formatCurrency(bill.grandTotal - discountAmount)}</td>
                </tr>

                {/* Advance Deductions */}
                <tr className="bg-emerald-50/40 text-emerald-900">
                  <td className="p-2.5">
                    <span className="font-semibold">Less: Advance Paid</span>
                    <span className="text-[11px] text-stone-500 block">
                      {checkOutBooking.payments?.map((p) => `${p.method}: ${formatCurrency(p.amount)}`).join(', ')}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700">
                    -{formatCurrency(bill.totalPaidAdvance)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Net Balance Banner */}
            <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Final Settlement Balance Due
                </span>
                <p className="text-[11px] text-rose-700">Collect from guest before handover of key.</p>
              </div>
              <div className="text-2xl font-black text-rose-700">
                {formatCurrency(finalBalanceDue)}
              </div>
            </div>
          </div>

          {/* Settlement Payment Details */}
          {finalBalanceDue > 0 && (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Collect Settlement Balance ({formatCurrency(finalBalanceDue)})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mode */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setSettlementMethod(mode)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-colors ${
                          settlementMethod === mode
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference ID */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Receipt / Transaction Ref (Optional)
                  </label>
                  <input
                    id="checkout-payment-ref"
                    type="text"
                    placeholder={settlementMethod === 'UPI' ? 'GPay / PhonePe UTR Number' : 'Cash Slip # / POS Slip'}
                    value={settlementRef}
                    onChange={(e) => setSettlementRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Concession Discount Input */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-stone-500">Apply owner discount/rounding (₹):</span>
            <input
              type="number"
              min="0"
              max={bill.balanceDue}
              value={discountAmount || ''}
              placeholder="0"
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-24 px-2 py-1 border border-stone-300 rounded-md text-right text-xs"
            />
          </div>

          {/* Workflow Note */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Automatic Workflow Transition:</strong> Upon settlement, Room{' '}
              <strong>{checkOutBooking.roomNumber}</strong> will automatically transition to{' '}
              <strong className="text-amber-800">"Cleaning Needed"</strong> status for housekeeping inspection,
              and a printable tax/room invoice will be generated immediately.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setCheckOutBooking(null)}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              id="btn-complete-checkout-submit"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Check-Out & Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
