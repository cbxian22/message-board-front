<!-- ChatHistory.vue -->
<template>
  <div class="history-container">
    <div class="header">
      <router-link to="/" class="back-button">返回好友</router-link>
      <h2>聊天記錄</h2>
    </div>
    <div class="history-list">
      <div
        v-for="chat in chatHistory"
        :key="chat.friendId"
        class="history-item"
        @click="goToChat(chat.friendId)"
      >
        <img :src="chat.avatar_url" :alt="chat.name" class="avatar" />
        <div class="chat-info">
          <span class="friend-name">{{ chat.name }}</span>
          <span class="last-message">{{ chat.lastMessage }}</span>
        </div>
      </div>
      <p v-if="chatHistory.length === 0">暫無聊天記錄</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

const router = useRouter();
const chatHistory = ref([]);
const friends = ref([]);
const db = ref(null);
const currentUserId = ref(null);

// 初始化資料庫
const initDB = async () => {
  db.value = await openDB("chatDB", 1, {
    upgrade(db) {
      db.createObjectStore("messages", { keyPath: "id" });
    },
  });
};

// 獲取好友清單
const fetchFriends = async () => {
  try {
    const response = await apiClient.get("friends"); // 注意：這裡應為 "/api/friends"，之前是 "/friends"
    friends.value = response.data;
    console.log("獲取好友清單:", friends.value);
    await loadChatHistory();
  } catch (err) {
    console.error(
      "獲取好友清單失敗:",
      err.response?.data?.message || err.message
    );
    // 可選擇跳轉至錯誤頁面或顯示提示，暫不處理
  }
};

// 獲取當前用戶 ID
const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    currentUserId.value = response.data.id.toString();
    console.log("當前用戶 ID:", currentUserId.value);
    // 只有成功獲取用戶 ID 後才繼續後續邏輯
    await fetchFriends();
  } catch (err) {
    console.error(
      "獲取用戶 ID 失敗:",
      err.response?.data?.message || err.message
    );
    router.push("/login"); // 跳轉至登入頁面
  }
};

// 載入聊天記錄
const loadChatHistory = async () => {
  if (!currentUserId.value) return; // 確保用戶 ID 已設置
  const allMessages = await db.value.getAll("messages");
  const chatMap = new Map();

  allMessages.forEach((msg) => {
    const friendId =
      msg.senderId === currentUserId.value ? msg.receiverId : msg.senderId;
    if (!chatMap.has(friendId)) {
      const friend = friends.value.find((f) => f.id.toString() === friendId);
      if (friend) {
        chatMap.set(friendId, {
          friendId,
          name: friend.name,
          avatar_url: friend.avatar_url,
          lastMessage: msg.content || "(媒體訊息)",
          timestamp: new Date(msg.createdAt).getTime(),
        });
      }
    } else {
      const existing = chatMap.get(friendId);
      const msgTime = new Date(msg.createdAt).getTime();
      if (msgTime > existing.timestamp) {
        existing.lastMessage = msg.content || "(媒體訊息)";
        existing.timestamp = msgTime;
      }
    }
  });

  chatHistory.value = Array.from(chatMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );
  console.log("聊天記錄:", chatHistory.value);
};

// 跳轉到聊天頁面
const goToChat = (friendId) => {
  router.push({ name: "Chat", params: { friendId } });
};

// 頁面掛載時執行
onMounted(async () => {
  await initDB();
  await fetchCurrentUser(); // 將後續邏輯移至 fetchCurrentUser 內
});
</script>

<style scoped>
.history-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 10px;
}

.back-button {
  text-decoration: none;
  color: #007bff;
  font-size: 14px;
}

.back-button:hover {
  text-decoration: underline;
}

h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.history-list {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: #f0f0f0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.friend-name {
  font-size: 16px;
  color: #333;
}

.last-message {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

p {
  color: #666;
  font-style: italic;
  text-align: center;
  margin: 15px 0;
}
</style>
