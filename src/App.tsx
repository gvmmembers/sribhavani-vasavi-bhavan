/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PMSProvider } from './context/PMSContext';
import { Header } from './components/Header';
import { RoomGrid } from './components/RoomGrid';
import { CheckInModal } from './components/CheckInModal';
import { GuestProfileModal } from './components/GuestProfileModal';
import { CheckOutModal } from './components/CheckOutModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { HousekeepingLedgerModal } from './components/HousekeepingLedgerModal';
import { BlockRoomModal } from './components/BlockRoomModal';
import { SystemBlueprintModal } from './components/SystemBlueprintModal';

export default function App() {
  return (
    <PMSProvider>
      <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          <RoomGrid />
        </main>
        <footer className="no-print border-t border-stone-200 bg-white py-4 px-6 text-center text-xs text-stone-500">
          <p>
            <strong>Sri Bhavani Vasavi Bhavan</strong> PMS • 85/32, Old Karkana Street, Tiruvannamalai, Tamil Nadu 606601
          </p>
          <p className="mt-0.5 text-stone-400">
            11 Rooms (8 AC & 3 Non-AC) • Single-Screen Front-Desk PMS Optimized for Operational Speed & Financial Accuracy
          </p>
        </footer>

        {/* Action Modals */}
        <CheckInModal />
        <GuestProfileModal />
        <CheckOutModal />
        <InvoicePrintModal />
        <BlockRoomModal />
        <HousekeepingLedgerModal />
        <SystemBlueprintModal />
      </div>
    </PMSProvider>
  );
}

