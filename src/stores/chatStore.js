import { defineStore } from "pinia";
import { openDB } from "idb";

export const useChatStore = defineStore("chatStore", {
  state: () => ({
    db: null,
  }),
  actions: {
    async initDB() {
      this.db = await openDB("chatDB", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("messages")) {
            db.createObjectStore("messages", { keyPath: "id" });
          }
        },
      });
    },
    async loadMessages(userId, friendId) {
      const chatId = this.getChatId(userId, friendId);
      const allMessages = await this.db.getAll("messages");
      return allMessages.filter((msg) => msg.chatId === chatId);
    },
    getChatId(userId, friendId) {
      return [userId, friendId].sort().join("-");
    },
    async createMessage(currentUser, friendId, content, file) {
      let media = null;
      if (file) {
        media = await this.processFile(file);
      }
      const message = {
        id: `${currentUser.id}-${friendId}-${Date.now()}`,
        chatId: this.getChatId(currentUser.id, friendId),
        senderId: currentUser.id,
        receiverId: friendId,
        content,
        media,
        isRead: false,
        createdAt: new Date(),
      };
      await this.saveMessage(message);
      return message;
    },
    async saveMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put(message);
    },
    async processFile(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            type: file.type.startsWith("image") ? "image" : "video",
            data: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    },
  },
});
