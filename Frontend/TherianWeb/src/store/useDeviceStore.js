import { create } from 'zustand';

const useDeviceStore = create((set) => ({
    isOnline: false,
    voltage: 0,
    rssi: 0,
    lastUpdate: null,
    setDeviceData: (data) => set((state) => ({ ...state, ...data, lastUpdate: new Date() })),
    setIsOnline: (status) => set({ isOnline: status }),
}));

export default useDeviceStore;
