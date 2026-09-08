import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Meetings } from './pages/Meetings';
import { MeetingDetail } from './pages/MeetingDetail';
import { AnalyzeMeeting } from './pages/AnalyzeMeeting';
import { ActionItems } from './pages/ActionItems';
import { Decisions } from './pages/Decisions';
import { Kanban } from './pages/Kanban';
import { TranscriptDetail } from './pages/TranscriptDetail';
import { ScheduleMeeting } from './pages/ScheduleMeeting';
import { Exports } from './pages/Exports';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/analyze" element={<AnalyzeMeeting />} />
          <Route path="/action-items" element={<ActionItems />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/transcript/:id" element={<TranscriptDetail />} />
          <Route path="/schedule" element={<ScheduleMeeting />} />
          <Route path="/exports" element={<Exports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>

      {/* Global Modals & Toast notifications */}
      <GlobalSearchModal />
      <ToastContainer />
    </BrowserRouter>
  );
}
