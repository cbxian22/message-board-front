<!-- ChatHistory.vue -->
<template>
  <NavbarUp />
  <div class="container-box">
    <div class="container">
      <input
        v-model="searchQuery"
        class="search"
        placeholder="搜尋用戶或貼文..."
        @input="handleSearch"
      />
      <div class="chat-list">
        <div
          v-if="searchResults.length > 0"
          v-for="result in searchResults"
          :key="result.id"
          class="search-item"
          @click="goToPage(result.id, result.type)"
        >
          <img :src="result.avatar_url" :alt="result.name" class="avatar" />
          <div class="info-name-message">
            <span class="friend-name">{{ result.name }}</span>
            <span class="result-type">{{
              result.type === "user" ? "用戶" : "貼文"
            }}</span>
          </div>
        </div>
        <div v-else-if="searchQuery && !isSearching" class="no-chat">
          沒有找到相關結果
        </div>
      </div>
    </div>
  </div>
  <Navbar />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useMessage, useLoadingBar, useDialog } from "naive-ui";

import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

const router = useRouter();
const dialog = useDialog();
const loadingBar = useLoadingBar();
const message = useMessage();

const searchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);

// 設置API客戶端
const apiClient = axios.create({
  baseURL: "https://message-board-server-7yot.onrender.com/api",
});

// 搜尋用戶和貼文
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  searchResults.value = [];

  try {
    // 1. 搜尋用戶
    const userResponse = await apiClient.get(`/users/${searchQuery.value}`);
    if (userResponse.data) {
      const user = userResponse.data;
      searchResults.value.push({
        id: user.id,
        name: user.accountname,
        avatar_url: user.avatar_url || "/default-avatar.png",
        type: "user",
      });

      // 2. 如果找到用戶，搜尋該用戶的貼文
      const postsResponse = await apiClient.get(`/posts?userId=${user.id}`);
      if (postsResponse.data && postsResponse.data.length > 0) {
        const posts = postsResponse.data.map((post) => ({
          id: post.id,
          name:
            post.content.substring(0, 20) +
            (post.content.length > 20 ? "..." : ""),
          avatar_url: user.avatar_url || "/default-avatar.png",
          type: "post",
          userId: user.id,
        }));
        searchResults.value.push(...posts);
      }
    }
  } catch (err) {
    if (err.response?.status === 404) {
      searchResults.value = [];
    } else {
      console.error("搜尋失敗:", err);
      message.error("搜尋失敗，請稍後再試");
    }
  } finally {
    isSearching.value = false;
  }
};

// 跳轉到聊天頁面，根據類型處理
const goToPage = (id, type) => {
  if (type === "user") {
    router.push({ name: "Profile", params: { searchQuery } });
  } else if (type === "post") {
    // 假設有一個顯示特定貼文的路由
    router.push({ name: "Post", params: { id } });
  }
};

onMounted(() => {
  // 可以選擇在這裡初始化一些預設數據，如果需要的話
});
</script>

<style scoped>
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin: 100px 0;
}

.search {
  padding: 20px 30px;
  cursor: text;
  border-bottom: 0.5px solid #373737;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
}

.search-item {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 0.5px solid #373737;
  cursor: pointer;
  gap: 20px;
}

.search-item:hover {
  background-color: rgba(55, 55, 55, 0.2) !important;
}
.light-mode .search-item:hover {
  background-color: rgba(55, 55, 55, 0.08) !important;
}

.search-item .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.info-name-message {
  display: flex;
  flex-direction: column;
  width: 50%;
  gap: 5px;
}

.result-type {
  font-size: 12px;
  color: #666;
}

.search-item:last-child {
  border-bottom: none;
}

.no-chat {
  color: #666;
  display: flex;
  padding: 20px 30px;
}
</style>
