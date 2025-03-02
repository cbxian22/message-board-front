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
        <!-- 僅在自己發送且已讀時顯示「已讀」 -->
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
import apiClient from "../stores/axiosConfig"; // 調整路徑

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
      message.createdAt = message.createdAt.toString(); // 轉為字符串
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
      if (message.receiverId === this.currentUserId) {
        this.markAsRead(message.id, message.senderId);
      }
    });

    this.socket.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      message.createdAt = message.createdAt.toString(); // 轉為字符串
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
    });

    this.socket.on("messageRead", ({ messageId }) => {
      console.log("消息已讀:", messageId);
      const msg = this.messages.find((m) => m.id === messageId);
      if (msg && msg.senderId === this.currentUserId) {
        msg.isRead = true;
        this.updateMessage(msg);
      }
    });

    this.socket.on("offlineMessages", async (messages) => {
      console.log("收到離線消息:", messages);
      for (const message of messages) {
        message.createdAt = message.createdAt.toString(); // 轉為字符串
        await this.saveMessage(message);
        this.addOrUpdateMessage(message);
        if (message.receiverId === this.currentUserId) {
          this.markAsRead(message.id, message.senderId); // 離線消息上線後標記已讀
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
      await tx.store.put({ ...message }); // 複製物件避免不可序列化問題
      await tx.done;
    },
    async updateMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put({ ...message }); // 複製物件避免不可序列化問題
      await tx.done;
    },
    async loadMessages() {
      const allMessages = await this.db.getAll("messages");
      this.messages = allMessages.filter(
        (msg) =>
          (msg.senderId === this.currentUserId &&
            msg.receiverId === this.friendId) ||
          (msg.senderId === this.friendId &&
            msg.receiverId === this.currentUserId)
      );
    },
    addOrUpdateMessage(message) {
      const existingMsg = this.messages.find((m) => m.id === message.id);
      if (existingMsg) {
        Object.assign(existingMsg, message); // 更新現有消息
      } else {
        this.messages.push({ ...message }); // 添加新消息，複製以避免引用問題
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
<!-- chatView.vue -->
<!-- <template>
  <div>
    <ul>
      <li
        v-for="msg in messages"
        :key="msg.id"
        :class="{ unread: !msg.isRead }"
      >
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
        <span>{{ msg.isRead ? "已讀" : "未讀" }}</span>
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
import apiClient from "../stores/axiosConfig"; // 調整路徑

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

    this.socket = io("wss://message-board-server-7yot.onrender.com", {
      query: { userId: this.currentUserId },
    });

    this.socket.on("connect", () => {
      console.log("WebSocket 連接成功");
      // 請求歷史消息（模擬同步）
      this.requestHistory();
    });

    this.socket.on("connect_error", (err) => {
      console.log("WebSocket 連接錯誤:", err);
    });

    this.socket.on("receiveMessage", async (message) => {
      console.log("收到消息:", message);
      await this.saveMessage(message);
      this.messages.push(message);
      if (message.receiverId === this.currentUserId) {
        message.isRead = true; // 立即更新本地狀態
        await this.updateMessage(message);
        this.markAsRead(message.id, message.senderId);
      }
    });

    this.socket.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await this.saveMessage(message);
      this.messages.push(message);
    });

    this.socket.on("messageRead", ({ messageId }) => {
      console.log("消息已讀:", messageId);
      const msg = this.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.isRead = true;
        this.updateMessage(msg);
      }
    });

    // 接收歷史消息（模擬）
    this.socket.on("historyMessages", async (history) => {
      console.log("收到歷史消息:", history);
      for (const message of history) {
        await this.saveMessage(message);
        if (!this.messages.some((m) => m.id === message.id)) {
          this.messages.push(message);
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
      await tx.store.put(message);
      await tx.done;
    },
    async updateMessage(message) {
      const tx = this.db.transaction("messages", "readwrite");
      await tx.store.put(message);
      await tx.done;
    },
    async loadMessages() {
      const allMessages = await this.db.getAll("messages");
      this.messages = allMessages.filter(
        (msg) =>
          (msg.senderId === this.currentUserId &&
            msg.receiverId === this.friendId) ||
          (msg.senderId === this.friendId &&
            msg.receiverId === this.currentUserId)
      );
    },
    markAsRead(messageId, senderId) {
      console.log("標記已讀:", { messageId, senderId });
      this.socket.emit("markAsRead", { messageId, senderId });
    },
    requestHistory() {
      // 模擬從對方請求歷史消息
      this.socket.emit("requestHistory", {
        senderId: this.currentUserId,
        receiverId: this.friendId,
      });
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
