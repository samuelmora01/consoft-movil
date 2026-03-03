import { create } from 'zustand';

type SessionState = {
  isSignedIn: boolean;
  setSignedIn: (v: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isSignedIn: false,
  setSignedIn: (v: boolean) => set({ isSignedIn: v }),
}));


