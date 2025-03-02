<!-- chatView.vue -->
<!-- <template>
  <div>
    <ul>
      <li v-for="msg in messages" :key="msg.id">
        <span>{{ msg.content }}</span>
        <img
          v-if="msg.media && msg.media.type === 'image'"
          :src="msg.media.data"
          alt="圖片"
          style="max-width: 200px"
        />
        <video
          v-if="msg.media && msg.media.type === 'video'"
          controls
          :src="msg.media.data"
          style="max-width: 200px"
        ></video>
        <span v-if="msg.senderId === currentUserId && msg.isRead">已讀</span>
      </li>
    </ul>
    <input
      v-model="newMessage"
      @keyup.enter="sendMessage"
      placeholder="輸入文字"
    />
    <input type="file" accept="image/*,video/*" @change="handleFileUpload" />
    <button @click="sendMessage">發送</button>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

export default {
  data() {
    return {
      socket: null,
      messages: [],
      newMessage: "",
      selectedFile: null,
      currentUserId: null,
      friendId: null,
      db: null,
    };
  },
  async mounted() {
    this.db = await openDB("chatDB", 1, {
      upgrade(db) {
        db.createObjectStore("messages", { keyPath: "id" });
      },
    });

    await this.loadMessages();

    try {
      const response = await apiClient.get("/auth/me");
      this.currentUserId = response.data.id.toString();
      console.log("當前用戶 ID:", this.currentUserId);
    } catch (err) {
      console.error(
        "獲取用戶 ID 失敗:",
        err.response?.data?.message || err.message
      );
      this.currentUserId = "2"; // 預設值
    }

    this.friendId = this.currentUserId === "2" ? "4" : "2"; // 測試用
    await this.loadMessages(); // 確保過濾正確

    this.socket = io("wss://message-board-server-7yot.onrender.com", {
      query: { userId: this.currentUserId },
    });

    this.socket.on("connect", () => {
      console.log("WebSocket 連接成功");
    });

    this.socket.on("connect_error", (err) => {
      console.log("WebSocket 連接錯誤:", err);
    });

    this.socket.on("receiveMessage", async (message) => {
      console.log("收到消息:", message);
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
      if (message.receiverId === this.currentUserId) {
        this.markAsRead(message.id, message.senderId);
      }
    });

    this.socket.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
    });

    this.socket.on("messageRead", ({ messageId }) => {
      console.log("消息已讀:", messageId);
      const msg = this.messages.find((m) => m.id === messageId);
      if (msg && msg.senderId === this.currentUserId) {
        msg.isRead = true;
        this.updateMessage(msg);
        console.log("更新發送者已讀狀態:", msg);
      }
    });

    this.socket.on("syncMessages", async (messages) => {
      console.log("收到短期同步消息:", messages);
      for (const message of messages) {
        await this.saveMessage(message);
        this.addOrUpdateMessage(message);
        if (message.receiverId === this.currentUserId) {
          this.markAsRead(message.id, message.senderId);
        }
      }
    });
  },
  methods: {
    async sendMessage() {
      if (this.newMessage.trim() || this.selectedFile) {
        const message = {
          senderId: this.currentUserId,
          receiverId: this.friendId,
          content: this.newMessage,
          media: this.selectedFile
            ? await this.processFile(this.selectedFile)
            : null,
        };
        console.log("發送消息:", message);
        this.socket.emit("sendMessage", message);
        this.newMessage = "";
        this.selectedFile = null;
      }
    },
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    async processFile(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            type: file.type.startsWith("image") ? "image" : "video",
            data: e.target.result,
          });
        };
        reader.readAsDataURL(file);
      });
    },
    async saveMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put({ ...message });
      await tx.done;
    },
    async updateMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put({ ...message });
      await tx.done;
      const msg = this.messages.find((m) => m.id === message.id);
      if (msg) {
        Object.assign(msg, message);
      }
    },
    async loadMessages() {
      const allMessages = await this.db.getAll("messages");
      console.log("從 IndexedDB 載入消息:", allMessages);
      this.messages = allMessages.filter(
        (msg) =>
          (msg.senderId === this.currentUserId &&
            msg.receiverId === this.friendId) ||
          (msg.senderId === this.friendId &&
            msg.receiverId === this.currentUserId)
      );
      console.log("更新後的 messages 陣列:", this.messages);
    },
    addOrUpdateMessage(message) {
      const existingMsg = this.messages.find((m) => m.id === message.id);
      if (existingMsg) {
        Object.assign(existingMsg, message);
      } else {
        this.messages.push({ ...message });
      }
    },
    markAsRead(messageId, senderId) {
      console.log("標記已讀:", { messageId, senderId });
      this.socket.emit("markAsRead", { messageId, senderId });
    },
  },
  beforeUnmount() {
    this.socket.disconnect();
  },
};
</script>

<style>
.unread {
  font-weight: bold;
  color: red;
}
</style> -->

<!-- chatView.vue -->
<template>
  <div>
    <ul>
      <li v-for="msg in messages" :key="msg.id">
        <span>{{ msg.content }}</span>
        <img
          v-if="msg.media && msg.media.type === 'image'"
          :src="msg.media.data"
          alt="圖片"
          style="max-width: 200px"
        />
        <video
          v-if="msg.media && msg.media.type === 'video'"
          controls
          :src="msg.media.data"
          style="max-width: 200px"
        ></video>
        <span v-if="msg.senderId === currentUserId && msg.isRead">已讀</span>
      </li>
    </ul>
    <input
      v-model="newMessage"
      @keyup.enter="sendMessage"
      placeholder="輸入文字"
    />
    <input type="file" accept="image/*,video/*" @change="handleFileUpload" />
    <button @click="sendMessage">發送</button>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

export default {
  data() {
    return {
      socket: null,
      messages: [],
      newMessage: "",
      selectedFile: null,
      currentUserId: null,
      friendId: null,
      db: null,
    };
  },
  async mounted() {
    this.db = await openDB("chatDB", 1, {
      upgrade(db) {
        db.createObjectStore("messages", { keyPath: "id" });
      },
    });

    await this.loadMessages();

    try {
      const response = await apiClient.get("/auth/me");
      this.currentUserId = response.data.id.toString();
      console.log("當前用戶 ID:", this.currentUserId);
    } catch (err) {
      console.error(
        "獲取用戶 ID 失敗:",
        err.response?.data?.message || err.message
      );
      this.currentUserId = "2"; // 預設值
    }

    this.friendId = this.currentUserId === "2" ? "4" : "2"; // 測試用
    await this.loadMessages(); // 確保過濾正確

    this.socket = io("wss://message-board-server-7yot.onrender.com", {
      query: { userId: this.currentUserId },
    });

    this.socket.on("connect", () => {
      console.log("WebSocket 連接成功");
    });

    this.socket.on("connect_error", (err) => {
      console.log("WebSocket 連接錯誤:", err);
    });

    this.socket.on("receiveMessage", async (message) => {
      console.log("收到消息:", message);
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
      if (message.receiverId === this.currentUserId) {
        this.markAsRead(message.id, message.senderId);
      }
    });

    this.socket.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
    });

    this.socket.on("messageRead", async ({ messageId }) => {
      console.log("消息已讀:", messageId);
      const msg = this.messages.find((m) => m.id === messageId);
      if (msg && msg.senderId === this.currentUserId) {
        msg.isRead = true;
        await this.updateMessage(msg); // 更新 IndexedDB 和 messages
        console.log("更新發送者已讀狀態:", msg);
      }
    });

    this.socket.on("syncMessages", async (messages) => {
      console.log("收到短期同步消息:", messages);
      for (const message of messages) {
        await this.saveMessage(message);
        this.addOrUpdateMessage(message);
        // 如果消息已讀且是自己的，確保本地同步
        if (message.receiverId === this.currentUserId && message.isRead) {
          this.markAsRead(message.id, message.senderId);
        }
      }
    });
  },
  methods: {
    async sendMessage() {
      if (this.newMessage.trim() || this.selectedFile) {
        const message = {
          senderId: this.currentUserId,
          receiverId: this.friendId,
          content: this.newMessage,
          media: this.selectedFile
            ? await this.processFile(this.selectedFile)
            : null,
        };
        console.log("發送消息:", message);
        this.socket.emit("sendMessage", message);
        this.newMessage = "";
        this.selectedFile = null;
      }
    },
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    async processFile(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            type: file.type.startsWith("image") ? "image" : "video",
            data: e.target.result,
          });
        };
        reader.readAsDataURL(file);
      });
    },
    async saveMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put({ ...message });
      await tx.done;
    },
    async updateMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put({ ...message });
      await tx.done;
      const msg = this.messages.find((m) => m.id === message.id);
      if (msg) {
        Object.assign(msg, message);
      }
    },
    async loadMessages() {
      const allMessages = await this.db.getAll("messages");
      console.log("從 IndexedDB 載入消息:", allMessages);
      this.messages = allMessages.filter(
        (msg) =>
          (msg.senderId === this.currentUserId &&
            msg.receiverId === this.friendId) ||
          (msg.senderId === this.friendId &&
            msg.receiverId === this.currentUserId)
      );
      console.log("更新後的 messages 陣列:", this.messages);
    },
    addOrUpdateMessage(message) {
      const existingMsg = this.messages.find((m) => m.id === message.id);
      if (existingMsg) {
        Object.assign(existingMsg, message);
      } else {
        this.messages.push({ ...message });
      }
    },
    markAsRead(messageId, senderId) {
      console.log("標記已讀:", { messageId, senderId });
      this.socket.emit("markAsRead", { messageId, senderId });
    },
  },
  beforeUnmount() {
    this.socket.disconnect();
  },
};
</script>

<style>
.unread {
  font-weight: bold;
  color: red;
}
</style>
