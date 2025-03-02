<!-- Friends.vue -->
<template>
  <div class="friends-container">
    <h2>我的好友</h2>
    <div class="friend-list">
      <div v-for="friend in friends" :key="friend.id" class="friend-item">
        <img :src="friend.avatar_url" :alt="friend.name" class="avatar" />
        <span class="friend-name">{{ friend.name }}</span>
        <div class="actions">
          <button @click="goToChat(friend.id)" class="chat-button">聊天</button>
          <button class="remove-button">解除好友</button>
        </div>
      </div>
      <p v-if="friends.length === 0">暫無好友</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const router = useRouter();
const friends = ref([]);

// 獲取好友清單
const fetchFriends = async () => {
  try {
    const response = await apiClient.get("/friends");
    friends.value = response.data;
    console.log("獲取好友清單:", friends.value);
  } catch (err) {
    console.error(
      "獲取好友清單失敗:",
      err.response?.data?.message || err.message
    );
  }
};

// 跳轉到聊天頁面
const goToChat = (friendId) => {
  router.push({ name: "ChatView", params: { friendId } });
};

// 頁面掛載時執行
onMounted(async () => {
  await fetchFriends();
});
</script>

<style scoped>
.friends-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

h2 {
  font-size: 20px;
  color: #333;
  margin: 20px 0 10px;
}

.friend-list {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.friend-item:last-child {
  border-bottom: none;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.friend-name {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.chat-button {
  padding: 5px 10px;
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-button:hover {
  background-color: #0056b3;
}

.remove-button {
  padding: 5px 10px;
  background-color: #dc3545;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: #c82333;
}

p {
  color: #666;
  font-style: italic;
  text-align: center;
  margin: 15px 0;
}
</style>
