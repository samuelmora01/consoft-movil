import { create } from 'zustand';

type ContactInfo = {
  backupEmail: string;
  backupPhone: string;
  defaultAddress: string;
};

type UserState = {
  contact: ContactInfo | null;
  setContact: (payload: ContactInfo) => void;
};

export const useUserStore = create<UserState>((set) => ({
  contact: null,
  setContact: (payload) => set({ contact: payload }),
}));


