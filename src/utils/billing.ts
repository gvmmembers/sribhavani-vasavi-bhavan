import { Booking, BillCalculation } from '../types';

export function calculateBill(booking: Booking, checkoutTime?: string): BillCalculation {
  const checkIn = new Date(booking.checkInTime);
  const isFutureOrReserved = booking.status === 'RESERVED' || checkIn.getTime() > Date.now();

  const checkOut = checkoutTime
    ? new Date(checkoutTime)
    : booking.actualCheckOutTime
    ? new Date(booking.actualCheckOutTime)
    : isFutureOrReserved
    ? new Date(booking.expectedCheckOutTime)
    : new Date();

  const diffMs = Math.max(0, checkOut.getTime() - checkIn.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  let daysStayed = 1;

  if (booking.billingCycleType === '24_HOUR_CYCLE') {
    // 24-hour cycle with 1-hour grace period
    if (diffHours <= 25) {
      daysStayed = 1;
    } else {
      daysStayed = Math.ceil((diffHours - 1) / 24);
    }
  } else {
    // Standard 11:00 AM checkout
    // Number of days is based on calendar date difference plus 11:00 AM cutoff
    const checkInDay = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const checkOutDay = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
    const dayDiff = Math.round((checkOutDay.getTime() - checkInDay.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff <= 0) {
      daysStayed = 1;
    } else if (dayDiff === 1 && checkOut.getHours() <= 12) {
      daysStayed = 1;
    } else {
      daysStayed = Math.max(1, dayDiff + (checkOut.getHours() > 12 ? 1 : 0));
    }
  }

  const hoursRemainder = Math.floor(diffHours % 24);
  const totalDaysExact = Math.floor(diffHours / 24);
  const durationFormatted =
    totalDaysExact > 0
      ? `${totalDaysExact}d ${hoursRemainder}h (${daysStayed} day${daysStayed > 1 ? 's' : ''} billed)`
      : `${Math.max(1, Math.floor(diffHours))}h (${daysStayed} day${daysStayed > 1 ? 's' : ''} billed)`;

  const roomRentTotal = daysStayed * booking.tariffPerDay;
  const extraBedQty = booking.extraBedCount ?? (booking.hasExtraBed ? 1 : 0);
  const extraBedTotal = extraBedQty > 0 ? daysStayed * extraBedQty * 150 : 0;
  const chargesTotal = (booking.charges || []).reduce((sum, chg) => sum + chg.totalAmount, 0);
  const subtotal = roomRentTotal + extraBedTotal + chargesTotal;

  const gstAmount = booking.gstEnabled ? Math.round(subtotal * (booking.gstRate ? booking.gstRate / 100 : 0.12)) : 0;
  const grandTotal = subtotal + gstAmount;

  const totalPaidAdvance = (booking.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const rawBalance = grandTotal - totalPaidAdvance;
  const balanceDue = Math.max(0, Math.round(rawBalance * 100) / 100);

  return {
    tariffPerDay: booking.tariffPerDay,
    daysStayed,
    roomRentTotal,
    durationFormatted,
    extraBedTotal,
    chargesTotal,
    subtotal,
    gstAmount,
    grandTotal,
    totalPaidAdvance: Math.round(totalPaidAdvance * 100) / 100,
    balanceDue,
  };
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasDecimals = rounded % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
