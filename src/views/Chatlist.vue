<!-- ChatHistory.vue -->
<template>
  <NavbarUp />
  <div class="container-box">
    <div class="back-icon">
      <router-link to="#" @click.prevent="$router.back()">
        <img class="icon" :src="Backicon" alt="Backicon" />
      </router-link>
    </div>
    <div class="container">
      <h2>信息</h2>
      <div class="chat-list">
        <p v-if="isLoading" class="no-chat">載入中...</p>

        <div
          v-for="chat in chatHistory"
          :key="chat.friendId"
          class="history-item"
          @click="goToChat(chat.friendId)"
        >
          <img :src="chat.avatar_url" :alt="chat.name" class="avatar" />
          <div class="info-name-message">
            <span class="friend-name">{{ chat.name }}</span>
            <span class="last-message">{{ chat.lastMessage }}</span>
          </div>
        </div>
        <p v-if="chatHistory.length === 0" class="no-friend">暫無聊天記錄</p>
      </div>
    </div>
  </div>
  <Navbar />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";
import { useMessage, useLoadingBar, useDialog } from "naive-ui";

import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

import Backicon from "../assets/Backicon.svg";

const router = useRouter();
const chatHistory = ref([]);
const friends = ref([]);
const dialog = useDialog();
const loadingBar = useLoadingBar();
const message = useMessage();
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

// const friends = [
//   {
//     id: 4,
//     name: "胡摩豬",
//     accountname: "shan4",
//     lastMessage: "sdfsdfsdfsdfsdfsdf",
//     avatar_url:
//       "https://storage.googleapis.com/message_board_storage/1000006562.jpg",
//   },
//   {
//     id: 34,
//     name: "麥香2",
//     accountname: "50150134",
//     lastMessage:
//       "sdfsdfsdfsdfsdfssdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfdf",
//     avatar_url:
//       "https://storage.googleapis.com/message_board_storage/S__162439172.jpg",
//   },
// ];

// 獲取好友清單

const fetchFriends = async () => {
  try {
    const response = await apiClient.get("friends");
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
    // router.push("/login"); // 跳轉至登入頁面
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
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin: 100px 0;
  margin-top: calc(100px - 44px);
}

.back-icon {
  margin: 15px 0 15px 5px;
  display: flex;
}

.back-icon a {
  display: flex;
}

h2 {
  padding: 20px 30px;
  cursor: default;
  border-bottom: 0.5px solid #373737;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 0.5px solid #373737;
  cursor: pointer;
  gap: 20px;
}

.history-item:hover {
  background-color: #373737 !important;
}

.history-item .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.info-name-message {
  display: flex;
  flex-direction: column;
  width: 50%;
}

.history-item:last-child {
  border-bottom: none;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.friend-name {
  display: flex;
  flex-direction: column;
}

.last-message {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-friend {
  color: #666;
  display: flex;
  padding: 20px 30px;
}
</style>
