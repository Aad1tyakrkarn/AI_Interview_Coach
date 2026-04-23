import { create } from 'zustand';

interface ReliabilityState {
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  isOffline: boolean;
  lastSaved: string | null;
  isSaving: boolean;
  lastHeartbeat: string | null;
  heartbeatLatency: number | null;
  restorableSessions: Array<{
    id: string;
    title: string;
    mode: string;
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    lastSnapshot: string;
  }>;

  setConnectionQuality: (quality: ReliabilityState['connectionQuality']) => void;
  setOffline: (offline: boolean) => void;
  setLastSaved: (timestamp: string) => void;
  setIsSaving: (saving: boolean) => void;
  setHeartbeat: (timestamp: string, latency: number) => void;
  setRestorableSessions: (sessions: ReliabilityState['restorableSessions']) => void;
}

export const useReliabilityStore = create<ReliabilityState>((set) => ({
  connectionQuality: 'good',
  isOffline: false,
  lastSaved: null,
  isSaving: false,
  lastHeartbeat: null,
  heartbeatLatency: null,
  restorableSessions: [],

  setConnectionQuality: (quality) => set({ connectionQuality: quality }),
  setOffline: (offline) => set({ isOffline: offline, connectionQuality: offline ? 'offline' : 'good' }),
  setLastSaved: (timestamp) => set({ lastSaved: timestamp, isSaving: false }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setHeartbeat: (timestamp, latency) => set({ lastHeartbeat: timestamp, heartbeatLatency: latency }),
  setRestorableSessions: (sessions) => set({ restorableSessions: sessions }),
}));
