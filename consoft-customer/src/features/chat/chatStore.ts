import { create } from 'zustand';

export type ChatMessage = { _id: string; message: string; sentAt: string; mine?: boolean; sender?: any };

type ChatState = {
  roomIdToMessages: Record<string, ChatMessage[]>;
  setRoomMessages: (roomId: string, messages: ChatMessage[]) => void;
  appendMessage: (roomId: string, message: ChatMessage) => void;
  clearRoom: (roomId: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  roomIdToMessages: {},
  setRoomMessages: (roomId, messages) =>
    set((s) => ({ roomIdToMessages: { ...s.roomIdToMessages, [roomId]: messages } })),
  appendMessage: (roomId, message) =>
    set((s) => {
      const prev = s.roomIdToMessages[roomId] || [];
      if (prev.some((m) => m._id === message._id)) return s;
      return { roomIdToMessages: { ...s.roomIdToMessages, [roomId]: [...prev, message] } };
    }),
  clearRoom: (roomId) =>
    set((s) => {
      const next = { ...s.roomIdToMessages };
      delete next[roomId];
      return { roomIdToMessages: next };
    }),
}));


