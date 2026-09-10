import React from 'react';
import { usePMS } from '../context/PMSContext';
import { LODGE_DETAILS } from '../data/seedData';
import { calculateBill, formatCurrency, formatDateTime } from '../utils/billing';
import { Printer, X, Download, Building2, CheckCircle2 } from 'lucide-react';

export const InvoicePrintModal: React.FC = () => {
  const { invoiceBooking, setInvoiceBooking } = usePMS();
  const [logoError, setLogoError] = React.useState(false);

  if (!invoiceBooking) return null;

  const bill = calculateBill(
    invoiceBooking,
    invoiceBooking.actualCheckOutTime || new Date().toISOString()
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="modal-invoice-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={() => setInvoiceBooking(null)}
    >
      <div
        id="modal-invoice-container"
        className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden on print) */}
        <div className="no-print bg-stone-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm">Guest Folio & Official Tax Invoice</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>

            <button
              onClick={() => setInvoiceBooking(null)}
              className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div
          id="printable-invoice"
          className="print-only p-8 bg-white text-stone-900 space-y-6 max-h-[85vh] overflow-y-auto"
        >
          {/* Lodge Header */}
          <div className="border-b-2 border-amber-900/40 pb-5 text-center sm:text-left flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {!logoError ? (
                  <img
                    src="/logo/bhavani-residency-logo-bg-removed.png"
                    alt={LODGE_DETAILS.name}
                    onError={() => setLogoError(true)}
                    className="h-14 w-auto object-contain shrink-0"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-amber-800 shrink-0" />
                )}
                <h1 className="text-2xl font-black tracking-tight text-amber-950 font-serif-title">
                  {LODGE_DETAILS.name}
                </h1>
              </div>
              <p className="text-xs font-medium text-amber-900">{LODGE_DETAILS.tagline}</p>
              <p className="text-xs text-stone-600 max-w-lg leading-relaxed">{LODGE_DETAILS.address}</p>
              <p className="text-xs text-stone-600">
                Front Desk: <strong>{LODGE_DETAILS.phone}</strong> • Email: {LODGE_DETAILS.email}
              </p>
              {invoiceBooking.gstEnabled && (
                <p className="text-xs text-stone-500 font-semibold">
                  GSTIN: {LODGE_DETAILS.gstin} • HSN/SAC: 996311 (Accommodation)
                </p>
              )}
            </div>

            <div className="text-right sm:border-l sm:border-stone-200 sm:pl-6 space-y-1 w-full sm:w-auto">
              <span className="inline-block text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                {invoiceBooking.gstEnabled ? 'TAX INVOICE' : 'GUEST FOLIO RECEIPT'}
              </span>
              <p className="text-xs font-bold text-stone-800 mt-2">
                Bill No: <span className="text-amber-950">{invoiceBooking.bookingNumber}</span>
              </p>
              <p className="text-[11px] text-stone-500">
                Date: {formatDateTime(invoiceBooking.actualCheckOutTime || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Guest & Room Details Two-Column Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
            {/* Left: Guest Details */}
            <div className="space-y-1.5">
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] block border-b border-stone-200 pb-1">
                Guest Particulars
              </span>
              <p className="font-bold text-sm text-stone-900">{invoiceBooking.guest.fullName}</p>
              <p className="text-stone-600">Mobile: {invoiceBooking.guest.primaryPhone}</p>
              <p className="text-stone-600">
                Origin: {invoiceBooking.guest.homeCity}, {invoiceBooking.guest.homeState}
              </p>
              <p className="text-stone-600">
                ID: {invoiceBooking.guest.idProofType} ({invoiceBooking.guest.idNumber})
              </p>
              {invoiceBooking.guest.vehicleNumber && (
                <p className="text-stone-600">Vehicle: {invoiceBooking.guest.vehicleNumber}</p>
              )}
            </div>

            {/* Right: Stay Details */}
            <div className="space-y-1.5">
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] block border-b border-stone-200 pb-1">
                Stay Particulars
              </span>
              <p className="font-bold text-sm text-stone-900">
                Room No: {invoiceBooking.roomNumber} ({invoiceBooking.isAcOpted ? 'AC Room' : 'Non-AC Room'})
              </p>
              <p className="text-stone-600">Check-In: {formatDateTime(invoiceBooking.checkInTime)}</p>
              <p className="text-stone-600">
                Check-Out: {formatDateTime(invoiceBooking.actualCheckOutTime || new Date().toISOString())}
              </p>
              <p className="text-stone-600">Stay Duration: {bill.durationFormatted}</p>
              <p className="text-stone-600">
                Occupancy: {invoiceBooking.guest.adults} Adults, {invoiceBooking.guest.children} Children
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-300 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Description & Service</th>
                  <th className="p-2.5 text-center">Qty / Days</th>
                  <th className="p-2.5 text-right">Unit Tariff</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {/* Room Rent */}
                <tr>
                  <td className="p-2.5 font-medium text-stone-500">1</td>
                  <td className="p-2.5 font-medium text-stone-900">
                    Room {invoiceBooking.roomNumber} Lodging Tariff ({bill.daysStayed} Day Cycle)
                  </td>
                  <td className="p-2.5 text-center font-semibold">{bill.daysStayed}</td>
                  <td className="p-2.5 text-right">{formatCurrency(bill.tariffPerDay)}</td>
                  <td className="p-2.5 text-right font-bold">{formatCurrency(bill.roomRentTotal)}</td>
                </tr>

                {/* Extra Bed / Mattress */}
                {bill.extraBedTotal > 0 && (
                  <tr>
                    <td className="p-2.5 font-medium text-stone-500">2</td>
                    <td className="p-2.5 font-medium text-stone-900">
                      Extra Bed / Mattress ({invoiceBooking.extraBedCount || 1} Bed × ₹150/day)
                    </td>
                    <td className="p-2.5 text-center font-semibold">{bill.daysStayed}</td>
                    <td className="p-2.5 text-right">₹{(invoiceBooking.extraBedCount || 1) * 150}</td>
                    <td className="p-2.5 text-right font-bold">{formatCurrency(bill.extraBedTotal)}</td>
                  </tr>
                )}

                {/* Add on charges */}
                {invoiceBooking.charges?.map((chg, idx) => (
                  <tr key={chg.id}>
                    <td className="p-2.5 font-medium text-stone-500">{idx + 2}</td>
                    <td className="p-2.5 font-medium text-stone-800">{chg.item}</td>
                    <td className="p-2.5 text-center font-semibold">{chg.quantity}</td>
                    <td className="p-2.5 text-right">{formatCurrency(chg.unitPrice)}</td>
                    <td className="p-2.5 text-right font-bold">{formatCurrency(chg.totalAmount)}</td>
                  </tr>
                ))}

                {/* Subtotal */}
                <tr className="bg-stone-50/70 font-semibold text-stone-800">
                  <td colSpan={4} className="p-2.5 text-right">
                    Subtotal
                  </td>
                  <td className="p-2.5 text-right">{formatCurrency(bill.subtotal)}</td>
                </tr>

                {/* GST */}
                {invoiceBooking.gstEnabled && (
                  <>
                    <tr className="text-stone-700">
                      <td colSpan={4} className="p-2 text-right">
                        CGST (6%)
                      </td>
                      <td className="p-2 text-right">{formatCurrency(Math.round(bill.gstAmount / 2))}</td>
                    </tr>
                    <tr className="text-stone-700">
                      <td colSpan={4} className="p-2 text-right">
                        SGST (6%)
                      </td>
                      <td className="p-2 text-right">{formatCurrency(Math.round(bill.gstAmount / 2))}</td>
                    </tr>
                  </>
                )}

                {/* Grand Total */}
                <tr className="bg-stone-100 font-black text-stone-950 text-sm">
                  <td colSpan={4} className="p-3 text-right">
                    Grand Total
                  </td>
                  <td className="p-3 text-right">{formatCurrency(bill.grandTotal)}</td>
                </tr>

                {/* Payments breakdown */}
                {invoiceBooking.payments?.map((p, idx) => (
                  <tr key={p.id} className="text-stone-600 bg-emerald-50/30 text-[11px]">
                    <td colSpan={4} className="p-2 text-right">
                      Paid via {p.method} ({p.type === 'ADVANCE' ? 'Advance' : 'Settlement'}){' '}
                      {p.referenceNumber ? `[Ref: ${p.referenceNumber}]` : ''}:
                    </td>
                    <td className="p-2 text-right font-semibold text-emerald-800">
                      -{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}

                {/* Net Balance Paid */}
                <tr className="bg-stone-50 font-bold text-xs text-stone-900 border-t-2 border-stone-300">
                  <td colSpan={4} className="p-2.5 text-right uppercase">
                    Balance Due / Status:
                  </td>
                  <td className="p-2.5 text-right text-emerald-700 font-black">
                    NIL (Fully Settled)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Signatures */}
          <div className="pt-6 border-t border-stone-200 text-[11px] text-stone-500 space-y-8">
            <div className="space-y-1">
              <p className="font-semibold text-stone-700">Guest Guidelines & Policies:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Check-out cycle is calculated on standard 24-hour cycle or 11:00 AM as agreed upon check-in.</li>
                <li>Management is not responsible for valuables left inside the room. Safety lockers available.</li>
                <li>Thank you for staying at Sri Bhavani Vasavi Bhavan. May Bhagavan Sri Arunachaleswarar bless your family!</li>
              </ul>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="text-center pt-8 border-t border-stone-300">
                <span className="font-semibold text-stone-800 block text-xs">Guest Signature</span>
                <span className="text-[10px] text-stone-400">({invoiceBooking.guest.fullName})</span>
              </div>
              <div className="text-center pt-8 border-t border-stone-300">
                <span className="font-semibold text-stone-800 block text-xs">
                  For Sri Bhavani Vasavi Bhavan
                </span>
                <span className="text-[10px] text-stone-400">(Authorized Signatory / Reception)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
