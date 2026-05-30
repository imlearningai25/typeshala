import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SoundState {
  isMuted: boolean;
  toggleMute: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      isMuted: false,
      toggleMute: () => set({ isMuted: !get().isMuted }),
    }),
    {
      name: "typeshala-sound",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
