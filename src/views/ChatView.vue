<!-- <template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <h2>好友</h2>
      <ul>
        <li
          v-for="friend in friends"
          :key="friend.id"
          @click="selectChat(friend.id)"
        >
          {{ friend.name }}
        </li>
      </ul>
    </div>

    <div class="chat-window">
      <div class="chat-header">
        <h2 v-if="activeChatUser">{{ activeChatUser.name }}</h2>
        <h2 v-else>請選擇好友</h2>
      </div>
      <div class="chat-messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="{ 'my-message': msg.senderId === userId }"
        >
          <p>{{ msg.content }}</p>
          <span>{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="message"
          @keyup.enter="sendMessage"
          placeholder="輸入訊息..."
        />
        <button @click="sendMessage">發送</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useChatStore } from "@/stores/chatStore";
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";

export default {
  setup() {
    const chatStore = useChatStore();
    const userStore = useAuthStore();
    const message = ref("");

    const userId = computed(() => userStore.userId);
    const friends = ref([]); // 這裡可以接 API 拿好友列表
    const activeChatUser = computed(() =>
      friends.value.find((f) => f.id === chatStore.activeChatId)
    );

    // 假設從 API 拿到好友列表
    onMounted(async () => {
      if (userId.value) {
        chatStore.connectWebSocket(userId.value);
        // 假設這裡能夠獲取好友列表
        friends.value = await fetchFriends(); // 假設 fetchFriends 是一個API函數
      }
    });

    const selectChat = async (friendId) => {
      await chatStore.setActiveChat(friendId);
    };

    const sendMessage = () => {
      if (message.value.trim()) {
        chatStore.sendMessage(message.value);
        message.value = "";
      }
    };

    return {
      messages: chatStore.messages,
      userId,
      friends,
      activeChatUser,
      message,
      selectChat,
      sendMessage,
    };
  },
};

// 假設 fetchFriends 是一個模擬 API 請求的函數
async function fetchFriends() {
  return [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ];
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.chat-sidebar {
  width: 250px;
  background: #f4f4f4;
  padding: 10px;
}

.chat-sidebar ul {
  list-style: none;
  padding: 0;
}

.chat-sidebar li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.chat-sidebar li:hover {
  background: #ddd;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 15px;
  background: #6200ea;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-messages div {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  max-width: 60%;
}

.my-message {
  background: #6200ea;

  align-self: flex-end;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: none;
}

.chat-input button {
  padding: 10px 15px;
  background: #6200ea;

  border: none;
  cursor: pointer;
}
</style> -->
<!-- chatView.vue -->
<!-- chatView.vue -->

<!-- chatView.vue -->
<!-- chatView.vue -->
<template>
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
import apiClient from "../stores/axiosConfig"; // 調整為你的實際路徑

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

    // 使用 apiClient 獲取當前用戶 ID
    try {
      const response = await apiClient.get("/auth/me");
      this.currentUserId = response.data.id.toString(); // 後端返回的是 id
      console.log("當前用戶 ID:", this.currentUserId);
    } catch (err) {
      console.error(
        "獲取用戶 ID 失敗:",
        err.response?.data?.message || err.message
      );
      this.currentUserId = "2"; // 預設值，測試用
    }

    // 測試用，手動設置 friendId，實際應從好友列表選擇
    this.friendId = this.currentUserId === "2" ? "4" : "2";

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
      this.messages.push(message);
      if (message.receiverId === this.currentUserId) {
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
