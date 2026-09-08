import { create } from 'zustand';
import { ActionItem, Decision, Meeting, TaskStatus } from '../types';
import { initialActionItems, initialDecisions, mockMeetings } from '../data/mockMeetings';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppState {
  meetings: Meeting[];
  actionItems: ActionItem[];
  decisions: Decision[];
  activeMeetingId: string;
  toasts: ToastMessage[];
  isSearchModalOpen: boolean;
  searchQuery: string;

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

  // Toasts
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  meetings: mockMeetings,
  actionItems: initialActionItems,
  decisions: initialDecisions,
  activeMeetingId: 'meet-q4-strategy',
  toasts: [],
  isSearchModalOpen: false,
  searchQuery: '',

  setActiveMeetingId: (id) => set({ activeMeetingId: id }),

  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateActionItemStatus: (id, status) => {
    set((state) => {
      const updated = state.actionItems.map((item) =>
        item.id === id ? { ...item, status } : item
      );
      // Also update in corresponding meeting
      const updatedMeetings = state.meetings.map((meeting) => ({
        ...meeting,
        actionItems: meeting.actionItems.map((item) =>
          item.id === id ? { ...item, status } : item
        ),
      }));
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
    set((state) => ({
      actionItems: [newItem, ...state.actionItems],
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: `Created action item: "${newItem.task}"`,
          type: 'success',
        },
      ],
    }));
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
    set((state) => ({
      decisions: state.decisions.filter((d) => d.id !== id),
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: 'Decision proposal rejected',
          type: 'info',
        },
      ],
    }));
  },

  updateDecisionStatus: (id, status) => {
    set((state) => ({
      decisions: state.decisions.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  },

  addDecision: (decision) => {
    const newDecision: Decision = {
      ...decision,
      id: `dec-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({
      decisions: [newDecision, ...state.decisions],
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: 'New decision added to record',
          type: 'success',
        },
      ],
    }));
  },

  addMeeting: (meeting) => {
    set((state) => ({
      meetings: [meeting, ...state.meetings],
      // Also add its action items and decisions into the global list
      actionItems: [...meeting.actionItems, ...state.actionItems],
      decisions: [...meeting.decisions, ...state.decisions],
      activeMeetingId: meeting.id,
      toasts: [
        ...state.toasts,
        {
          id: `toast-${Date.now()}`,
          message: `Meeting "${meeting.title}" analyzed successfully. ${meeting.actionItems.length} action items extracted.`,
          type: 'success',
        },
      ],
    }));
  },

  updateMeeting: (id, updates) => {
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
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
