import { create } from 'zustand';
import type { Disruption } from '@/types';

interface DisruptionState {
  disruptions: Disruption[];
  setDisruptions: (disruptions: Disruption[]) => void;
  addDisruption: (disruption: Disruption) => void;
  updateDisruption: (id: string, disruption: Disruption) => void;
  ackDisruption: (id: string) => void;
}

export const useDisruptionStore = create<DisruptionState>((set) => ({
  disruptions: [],
  setDisruptions: (disruptions) => set({ disruptions }),
  addDisruption: (disruption) => set((state) => ({ 
    disruptions: [disruption, ...state.disruptions.filter(d => d.id !== disruption.id)]
  })),
  updateDisruption: (id, disruption) => set((state) => ({
    disruptions: state.disruptions.map(d => d.id === id ? { ...d, ...disruption } : d)
  })),
  ackDisruption: (id) => set((state) => ({
    disruptions: state.disruptions.map(d => d.id === id ? { ...d, isAcknowledged: true } : d)
  })),
}));
