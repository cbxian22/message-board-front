<!-- chatView.vue  welldown-->
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
    await this.loadMessages();

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
      if (message.receiverId === this.currentUserId && !message.isRead) {
        this.markAsRead(message.id, message.senderId, message.receiverId);
      }
    });

    this.socket.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await this.saveMessage(message);
      this.addOrUpdateMessage(message);
    });

    this.socket.on("messageRead", async ({ messageId }) => {
      console.log("收到消息已讀通知:", messageId);
      let msg = this.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.isRead = true; // 直接修改屬性
        await this.updateMessage(msg);
        console.log("更新現有消息已讀狀態:", msg);
        // 確保 UI 更新
        this.messages = [...this.messages];
      } else {
        console.log(
          `消息 ${messageId} 未在當前 messages 中，嘗試從 IndexedDB 載入`
        );
        const allMessages = await this.db.getAll("messages");
        const missingMsg = allMessages.find((m) => m.id === messageId);
        if (missingMsg) {
          missingMsg.isRead = true;
          await this.saveMessage(missingMsg);
          this.addOrUpdateMessage(missingMsg);
          console.log("從 IndexedDB 載入並更新消息:", missingMsg);
          // 強制觸發 UI 更新
          this.messages = [...this.messages];
        } else {
          console.log(`消息 ${messageId} 在 IndexedDB 中也未找到`);
        }
      }
    });

    this.socket.on("syncMessages", async (messages) => {
      console.log("收到短期同步消息:", messages);
      for (const message of messages) {
        await this.saveMessage(message);
        this.addOrUpdateMessage(message);
        if (message.receiverId === this.currentUserId && !message.isRead) {
          this.markAsRead(message.id, message.senderId, message.receiverId);
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
    markAsRead(messageId, senderId, receiverId) {
      console.log("標記已讀:", { messageId, senderId, receiverId });
      this.socket.emit("markAsRead", { messageId, senderId, receiverId });
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

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

// 定義響應式變數
const socket = ref(null);
const messages = ref([]);
const newMessage = ref("");
const selectedFile = ref(null);
const currentUserId = ref(null);
const friendId = ref(null);
const db = ref(null);

// 初始化資料庫並載入消息
const loadMessages = async () => {
  const allMessages = await db.value.getAll("messages");
  console.log("從 IndexedDB 載入消息:", allMessages);
  messages.value = allMessages.filter(
    (msg) =>
      (msg.senderId === currentUserId.value &&
        msg.receiverId === friendId.value) ||
      (msg.senderId === friendId.value &&
        msg.receiverId === currentUserId.value)
  );
  console.log("更新後的 messages 陣列:", messages.value);
};

// 儲存消息到 IndexedDB
const saveMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
};

// 更新消息到 IndexedDB
const updateMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
  const msg = messages.value.find((m) => m.id === message.id);
  if (msg) Object.assign(msg, message);
};

// 添加或更新消息到本地陣列
const addOrUpdateMessage = (message) => {
  const existingMsg = messages.value.find((m) => m.id === message.id);
  if (existingMsg) {
    Object.assign(existingMsg, message);
  } else {
    messages.value.push({ ...message });
  }
};

// 發送消息
const sendMessage = async () => {
  if (newMessage.value.trim() || selectedFile.value) {
    const message = {
      senderId: currentUserId.value,
      receiverId: friendId.value,
      content: newMessage.value,
      media: selectedFile.value ? await processFile(selectedFile.value) : null,
    };
    console.log("發送消息:", message);
    socket.value.emit("sendMessage", message);
    newMessage.value = "";
    selectedFile.value = null;
  }
};

// 處理檔案上傳
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
};

// 處理檔案轉換為 Data URL
const processFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        type: file.type.startsWith("image") ? "image" : "video",
        data: e.target.result,
      });
    reader.readAsDataURL(file);
  });
};

// 標記消息為已讀
const markAsRead = (messageId, senderId, receiverId) => {
  console.log("標記已讀:", { messageId, senderId, receiverId });
  socket.value.emit("markAsRead", { messageId, senderId, receiverId });
};

// 頁面掛載時執行
onMounted(async () => {
  db.value = await openDB("chatDB", 1, {
    upgrade(db) {
      db.createObjectStore("messages", { keyPath: "id" });
    },
  });

  await loadMessages();

  try {
    const response = await apiClient.get("/auth/me");
    currentUserId.value = response.data.id.toString();
    console.log("當前用戶 ID:", currentUserId.value);
  } catch (err) {
    console.error(
      "獲取用戶 ID 失敗:",
      err.response?.data?.message || err.message
    );
    currentUserId.value = "2"; // 預設值
  }

  friendId.value = currentUserId.value === "2" ? "4" : "2"; // 測試用
  await loadMessages();

  socket.value = io("wss://message-board-server-7yot.onrender.com", {
    query: { userId: currentUserId.value },
  });

  socket.value.on("connect", () => {
    console.log("WebSocket 連接成功");
  });

  socket.value.on("connect_error", (err) => {
    console.log("WebSocket 連接錯誤:", err);
  });

  socket.value.on("receiveMessage", async (message) => {
    console.log("收到消息:", message);
    await saveMessage(message);
    addOrUpdateMessage(message);
    if (message.receiverId === currentUserId.value && !message.isRead) {
      markAsRead(message.id, message.senderId, message.receiverId);
    }
  });

  socket.value.on("messageSent", async (message) => {
    console.log("消息已發送:", message);
    await saveMessage(message);
    addOrUpdateMessage(message);
  });

  socket.value.on("messageRead", async ({ messageId }) => {
    console.log("收到消息已讀通知:", messageId);
    let msg = messages.value.find((m) => m.id === messageId);
    if (msg) {
      msg.isRead = true;
      await updateMessage(msg);
      console.log("更新現有消息已讀狀態:", msg);
      messages.value = [...messages.value]; // 觸發 UI 更新
    } else {
      console.log(
        `消息 ${messageId} 未在當前 messages 中，嘗試從 IndexedDB 載入`
      );
      const allMessages = await db.value.getAll("messages");
      const missingMsg = allMessages.find((m) => m.id === messageId);
      if (missingMsg) {
        missingMsg.isRead = true;
        await saveMessage(missingMsg);
        addOrUpdateMessage(missingMsg);
        console.log("從 IndexedDB 載入並更新消息:", missingMsg);
        messages.value = [...messages.value]; // 觸發 UI 更新
      } else {
        console.log(`消息 ${messageId} 在 IndexedDB 中也未找到`);
      }
    }
  });

  socket.value.on("syncMessages", async (messagesData) => {
    console.log("收到短期同步消息:", messagesData);
    for (const message of messagesData) {
      await saveMessage(message);
      addOrUpdateMessage(message);
      if (message.receiverId === currentUserId.value && !message.isRead) {
        markAsRead(message.id, message.senderId, message.receiverId);
      }
    }
  });
});

// 頁面卸載前斷開 WebSocket
onBeforeUnmount(() => {
  socket.value.disconnect();
});
</script>

<style>
.unread {
  font-weight: bold;
  color: red;
}
</style>
