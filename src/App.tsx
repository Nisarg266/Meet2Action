import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useAppStore } from './store/appStore';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { SplashScreen } from './components/common/SplashScreen';

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
import { TeamMembers } from './pages/TeamMembers';
import { Contacts } from './pages/Contacts';
import { CalendarView } from './pages/CalendarView';
import { IntegrationsHub } from './pages/IntegrationsHub';
import { HelpCenter } from './pages/HelpCenter';

export default function App() {
  const { showSplash, setShowSplash } = useAppStore();

  return (
    <BrowserRouter>
      {/* Animated AI Splash Screen */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

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

          {/* New Polished Pages */}
          <Route path="/team" element={<TeamMembers />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/integrations" element={<IntegrationsHub />} />
          <Route path="/help" element={<HelpCenter />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>

      {/* Global Modals & Toast notifications */}
      <GlobalSearchModal />
      <ToastContainer />
    </BrowserRouter>
  );
}
