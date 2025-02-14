import { defineStore } from "pinia";
import {
  saveMessage,
  getMessages,
  deleteMessage,
  searchMessages,
} from "@/services/indexedDB";

export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: [],
    activeChatId: null,
    ws: null,
    userId: null,
  }),

  actions: {
    connectWebSocket(userId) {
      if (this.ws) return;

      this.userId = userId;
      this.ws = new WebSocket(
        `wss://message-board-server-7yot.onrender.com?userId=${userId}`
      );

      this.ws.onopen = () => console.log("✅ WebSocket 已連接");

      this.ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (
          data.type === "NEW_MESSAGE" &&
          data.message.chatId === this.activeChatId
        ) {
          this.messages.push(data.message);
          await saveMessage(data.message);
        }
      };

      this.ws.onclose = () => {
        console.log("❌ WebSocket 連線關閉");
        this.ws = null;
      };
    },

    async setActiveChat(chatId) {
      this.activeChatId = chatId;
      this.messages = await getMessages(chatId);
    },

    async sendMessage(content) {
      if (!this.activeChatId || !this.ws) return;

      const newMessage = {
        chatId: this.activeChatId,
        senderId: this.userId,
        content,
        timestamp: Date.now(),
      };

      this.ws.send(
        JSON.stringify({ type: "NEW_MESSAGE", message: newMessage })
      );
      this.messages.push(newMessage);
      await saveMessage(newMessage);
    },

    async removeMessage(messageId) {
      await deleteMessage(messageId);
      this.messages = this.messages.filter((msg) => msg.id !== messageId);
    },

    async searchChat(keyword) {
      if (!this.activeChatId) return [];
      return await searchMessages(this.activeChatId, keyword);
    },
  },
});
