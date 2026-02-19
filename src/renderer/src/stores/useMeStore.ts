import { create } from 'zustand';

type MeState = {
  meName: string;
  setMeName: (name?: string | null) => void;
  clearMe: () => void;
};

export const useMeStore = create<MeState>((set) => ({
  meName: '',
  setMeName: (name) => set({ meName: (name ?? '').trim() }),
  clearMe: () => set({ meName: '' })
}));
