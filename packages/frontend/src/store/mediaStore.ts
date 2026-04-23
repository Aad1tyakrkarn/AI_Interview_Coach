import { create } from 'zustand';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

interface MediaState {
  micPermission: PermissionState;
  cameraPermission: PermissionState;
  micStream: MediaStream | null;
  cameraStream: MediaStream | null;
  isMicMuted: boolean;
  selectedMicId: string;
  selectedCameraId: string;
  micDevices: MediaDeviceInfo[];
  cameraDevices: MediaDeviceInfo[];

  requestMicPermission: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
  setMicStream: (stream: MediaStream | null) => void;
  setCameraStream: (stream: MediaStream | null) => void;
  toggleMicMute: () => void;
  setSelectedMic: (id: string) => void;
  setSelectedCamera: (id: string) => void;
  loadDevices: () => Promise<void>;
  stopAllStreams: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  micPermission: 'unknown',
  cameraPermission: 'unknown',
  micStream: null,
  cameraStream: null,
  isMicMuted: false,
  selectedMicId: '',
  selectedCameraId: '',
  micDevices: [],
  cameraDevices: [],

  requestMicPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      set({ micPermission: 'granted' });
      await get().loadDevices();
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        set({ micPermission: 'denied' });
      } else {
        set({ micPermission: 'denied' });
      }
      return false;
    }
  },

  requestCameraPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      set({ cameraPermission: 'granted' });
      await get().loadDevices();
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        set({ cameraPermission: 'denied' });
      } else {
        set({ cameraPermission: 'denied' });
      }
      return false;
    }
  },

  setMicStream: (stream) => {
    const { micStream } = get();
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }
    set({ micStream: stream });
  },

  setCameraStream: (stream) => {
    const { cameraStream } = get();
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    set({ cameraStream: stream });
  },

  toggleMicMute: () => {
    const { micStream, isMicMuted } = get();
    if (micStream) {
      micStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicMuted; // toggle: if muted, enable; if unmuted, disable
      });
    }
    set({ isMicMuted: !isMicMuted });
  },

  setSelectedMic: (id) => set({ selectedMicId: id }),

  setSelectedCamera: (id) => set({ selectedCameraId: id }),

  loadDevices: async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = allDevices.filter((d) => d.kind === 'audioinput');
      const cameraDevices = allDevices.filter((d) => d.kind === 'videoinput');
      set({ micDevices, cameraDevices });
    } catch {
      // Devices not available
    }
  },

  stopAllStreams: () => {
    const { micStream, cameraStream } = get();
    micStream?.getTracks().forEach((t) => t.stop());
    cameraStream?.getTracks().forEach((t) => t.stop());
    set({
      micStream: null,
      cameraStream: null,
      isMicMuted: false,
    });
  },
}));
