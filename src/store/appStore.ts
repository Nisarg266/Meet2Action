import { create } from 'zustand';
import { ActionItem, Decision, Meeting, ScheduledMeeting, ScheduledMeetingStatus, TaskStatus } from '../types';

const STORAGE_KEYS = {
  MEETINGS: 'meetflow_real_meetings',
  SCHEDULED_MEETINGS: 'meetflow_scheduled_meetings',
  ACTION_ITEMS: 'meetflow_real_action_items',
  DECISIONS: 'meetflow_real_decisions',
  NOTIFICATIONS: 'meetflow_notifications',
};

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'action' | 'decision' | 'meeting' | 'system';
  read: boolean;
  link?: string;
}

interface AppState {
  meetings: Meeting[];
  scheduledMeetings: ScheduledMeeting[];
  actionItems: ActionItem[];
  decisions: Decision[];
  activeMeetingId: string;
  toasts: ToastMessage[];
  isSearchModalOpen: boolean;
  searchQuery: string;

  // Splash Screen State
  showSplash: boolean;
  setShowSplash: (val: boolean) => void;

  // Workspace State
  currentWorkspace: string;
  setCurrentWorkspace: (ws: string) => void;

  // Notifications State
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'read'>) => void;

  // Actions
  setActiveMeetingId: (id: string) => void;
  setSearchModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Action Items
  updateActionItemStatus: (id: string, status: TaskStatus) => void;
  confirmActionItem: (id: string) => void;
  rejectActionItem: (id: string) => void;
  editActionItem: (id: string, updates: Partial<ActionItem>) => void;
  addActionItem: (item: Omit<ActionItem, 'id'>) => void;

  // Decisions
  confirmDecision: (id: string) => void;
  rejectDecision: (id: string) => void;
  updateDecisionStatus: (id: string, status: Decision['status']) => void;
  addDecision: (decision: Omit<Decision, 'id'>) => void;

  // Meetings
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;

  // Scheduled Meetings
  addScheduledMeeting: (meeting: ScheduledMeeting) => void;
  updateScheduledMeeting: (id: string, updates: Partial<ScheduledMeeting>) => void;
  cancelScheduledMeeting: (id: string) => void;
  deleteScheduledMeeting: (id: string) => void;
  updateScheduledMeetingStatus: (id: string, status: ScheduledMeetingStatus) => void;
  updateScheduledMeetingStatusByRoom: (roomId: string, status: ScheduledMeetingStatus) => void;
  setScheduledMeetings: (meetings: ScheduledMeeting[]) => void;

  // Clear / Reset
  clearWorkspaceData: () => void;

  // Toasts
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const initialMeetings = loadStorage<Meeting[]>(STORAGE_KEYS.MEETINGS, []);
const initialScheduled = loadStorage<ScheduledMeeting[]>(STORAGE_KEYS.SCHEDULED_MEETINGS, []);
const initialActions = loadStorage<ActionItem[]>(STORAGE_KEYS.ACTION_ITEMS, []);
const initialDecs = loadStorage<Decision[]>(STORAGE_KEYS.DECISIONS, []);
const initialNotifs = loadStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);

export const useAppStore = create<AppState>((set) => ({
  meetings: initialMeetings,
  scheduledMeetings: initialScheduled,
  actionItems: initialActions,
  decisions: initialDecs,
  activeMeetingId: initialMeetings.length > 0 ? initialMeetings[0].id : '',
  toasts: [],
  isSearchModalOpen: false,
  searchQuery: '',

  // Splash Screen State
  showSplash: true,
  setShowSplash: (val: boolean) => set({ showSplash: val }),

  // Workspace State
  currentWorkspace: 'MeetFlow AI · Operations',
  setCurrentWorkspace: (ws: string) => set({ currentWorkspace: ws }),

  // Notifications
  notifications: initialNotifs,
  markAllNotificationsRead: () =>
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return { notifications: updated };
    }),
  dismissNotification: (id) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return { notifications: updated };
    }),
  addNotification: (notif) =>
    set((state) => {
      const item: AppNotification = {
        ...notif,
        id: `notif-${Date.now()}`,
        read: false,
      };
      const updated = [item, ...state.notifications];
      saveStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return { notifications: updated };
    }),


  setActiveMeetingId: (id) => set({ activeMeetingId: id }),

  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateActionItemStatus: (id, status) => {
    set((state) => {
      const updated = state.actionItems.map((item) =>
        item.id === id ? { ...item, status } : item
      );
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        actionItems: meeting.actionItems.map((item) =>
          item.id === id ? { ...item, status } : item
        ),
      }));
      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updated);
      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);
      return { actionItems: updated, meetings: updatedMeetings };
    });
  },

  confirmActionItem: (id) => {
    set((state) => {
      let taskName = '';
      const updated = state.actionItems.map((item) => {
        if (item.id === id) {
          taskName = item.task;
          return { ...item, isConfirmed: true, confidence: Math.max(item.confidence, 95) };
        }
        return item;
      });
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        actionItems: meeting.actionItems.map((item) =>
          item.id === id ? { ...item, isConfirmed: true, confidence: Math.max(item.confidence, 95) } : item
        ),
      }));

      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updated);
      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);

      const newToasts = [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: taskName ? `Confirmed task: "${taskName}"` : 'Task confirmed successfully',
          type: 'success' as const,
        },
      ];

      return { actionItems: updated, meetings: updatedMeetings, toasts: newToasts };
    });
  },

  rejectActionItem: (id) => {
    set((state) => {
      const target = state.actionItems.find((i) => i.id === id);
      const updated = state.actionItems.filter((item) => item.id !== id);
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        actionItems: meeting.actionItems.filter((item) => item.id !== id),
      }));

      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updated);
      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);

      const newToasts = [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: target ? `Rejected "${target.task}"` : 'Action item rejected',
          type: 'info' as const,
        },
      ];

      return { actionItems: updated, meetings: updatedMeetings, toasts: newToasts };
    });
  },

  editActionItem: (id, updates) => {
    set((state) => {
      const updated = state.actionItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        actionItems: meeting.actionItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));

      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updated);
      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);

      const newToasts = [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: 'Task updated successfully',
          type: 'success' as const,
        },
      ];

      return { actionItems: updated, meetings: updatedMeetings, toasts: newToasts };
    });
  },

  addActionItem: (item) => {
    const newItem: ActionItem = {
      ...item,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const updated = [newItem, ...state.actionItems];
      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updated);
      return {
        actionItems: updated,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: `Created action item: "${newItem.task}"`,
            type: 'success',
          },
        ],
      };
    });
  },

  confirmDecision: (id) => {
    set((state) => {
      const updated = state.decisions.map((dec) =>
        dec.id === id ? { ...dec, status: 'confirmed' as const, quorumStatus: '100% Consensus' } : dec
      );
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        decisions: meeting.decisions.map((dec) =>
          dec.id === id ? { ...dec, status: 'confirmed' as const, quorumStatus: '100% Consensus' } : dec
        ),
      }));

      saveStorage(STORAGE_KEYS.DECISIONS, updated);
      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);

      return {
        decisions: updated,
        meetings: updatedMeetings,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: 'Decision confirmed and logged into consensus record',
            type: 'success',
          },
        ],
      };
    });
  },

  rejectDecision: (id) => {
    set((state) => {
      const updated = state.decisions.filter((d) => d.id !== id);
      saveStorage(STORAGE_KEYS.DECISIONS, updated);
      return {
        decisions: updated,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: 'Decision proposal rejected',
            type: 'info',
          },
        ],
      };
    });
  },

  updateDecisionStatus: (id, status) => {
    set((state) => {
      const updated = state.decisions.map((d) => (d.id === id ? { ...d, status } : d));
      saveStorage(STORAGE_KEYS.DECISIONS, updated);
      return { decisions: updated };
    });
  },

  addDecision: (decision) => {
    const newDecision: Decision = {
      ...decision,
      id: `dec-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const updated = [newDecision, ...state.decisions];
      saveStorage(STORAGE_KEYS.DECISIONS, updated);
      return {
        decisions: updated,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: 'New decision added to record',
            type: 'success',
          },
        ],
      };
    });
  },

  addMeeting: (meeting) => {
    set((state) => {
      const updatedMeetings = [meeting, ...state.meetings];
      const updatedActions = [...meeting.actionItems, ...state.actionItems];
      const updatedDecisions = [...meeting.decisions, ...state.decisions];

      saveStorage(STORAGE_KEYS.MEETINGS, updatedMeetings);
      saveStorage(STORAGE_KEYS.ACTION_ITEMS, updatedActions);
      saveStorage(STORAGE_KEYS.DECISIONS, updatedDecisions);

      return {
        meetings: updatedMeetings,
        actionItems: updatedActions,
        decisions: updatedDecisions,
        activeMeetingId: meeting.id,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: `Meeting "${meeting.title}" analyzed successfully. ${meeting.actionItems.length} action items extracted.`,
            type: 'success',
          },
        ],
      };
    });
  },

  updateMeeting: (id, updates) => {
    set((state) => {
      const updated = state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m));
      saveStorage(STORAGE_KEYS.MEETINGS, updated);
      return { meetings: updated };
    });
  },

  clearWorkspaceData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.MEETINGS);
      localStorage.removeItem(STORAGE_KEYS.SCHEDULED_MEETINGS);
      localStorage.removeItem(STORAGE_KEYS.ACTION_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.DECISIONS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    }
    set({
      meetings: [],
      scheduledMeetings: [],
      actionItems: [],
      decisions: [],
      notifications: [],
      activeMeetingId: '',
    });
  },

  // Scheduled Meetings Actions
  addScheduledMeeting: (meeting) => {
    set((state) => {
      const updated = [...state.scheduledMeetings.filter((m) => m.id !== meeting.id), meeting].sort(
        (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      );
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return {
        scheduledMeetings: updated,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: `Meeting "${meeting.title}" scheduled successfully.`,
            type: 'success',
          },
        ],
      };
    });
  },

  updateScheduledMeeting: (id, updates) => {
    set((state) => {
      const updated = state.scheduledMeetings.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      );
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return { scheduledMeetings: updated };
    });
  },

  cancelScheduledMeeting: (id) => {
    set((state) => {
      const updated = state.scheduledMeetings.map((m) =>
        m.id === id ? { ...m, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : m
      );
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return {
        scheduledMeetings: updated,
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}`,
            message: 'Scheduled meeting has been cancelled.',
            type: 'info',
          },
        ],
      };
    });
  },

  deleteScheduledMeeting: (id) => {
    set((state) => {
      const updated = state.scheduledMeetings.filter((m) => m.id !== id);
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return { scheduledMeetings: updated };
    });
  },

  updateScheduledMeetingStatus: (id, status) => {
    set((state) => {
      const updated = state.scheduledMeetings.map((m) =>
        m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m
      );
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return { scheduledMeetings: updated };
    });
  },

  updateScheduledMeetingStatusByRoom: (roomId, status) => {
    set((state) => {
      const normalized = (roomId || '').toLowerCase().trim();
      const updated = state.scheduledMeetings.map((m) =>
        m.roomId.toLowerCase() === normalized ? { ...m, status, updatedAt: new Date().toISOString() } : m
      );
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, updated);
      return { scheduledMeetings: updated };
    });
  },

  setScheduledMeetings: (meetings) => {
    set(() => {
      saveStorage(STORAGE_KEYS.SCHEDULED_MEETINGS, meetings);
      return { scheduledMeetings: meetings };
    });
  },


  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
