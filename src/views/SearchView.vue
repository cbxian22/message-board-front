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

<!-- ChatHistory.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
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
    }

    // 2. 獲取所有貼文並過濾（假設有 GET /posts 端點）
    const postsResponse = await apiClient.get(`/posts`); // 需要確認是否有這個端點
    if (postsResponse.data && postsResponse.data.length > 0) {
      const posts = postsResponse.data
        .filter((post) =>
          post.content.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
        .map((post) => ({
          id: post.id,
          name:
            post.content.substring(0, 20) +
            (post.content.length > 20 ? "..." : ""),
          avatar_url: post.user_avatar || "/default-avatar.png",
          type: "post",
        }));
      searchResults.value.push(...posts);
    }
  } catch (err) {
    if (err.response?.status === 404) {
      if (searchResults.value.length === 0) {
        searchResults.value = [];
      }
    } else {
      console.error("搜尋失敗:", err);
      message.error("搜尋失敗，請稍後再試");
    }
  } finally {
    isSearching.value = false;
  }
};

// 跳轉到對應頁面
const goToPage = (id, type) => {
  if (type === "user") {
    router.push({
      name: "Profile",
      params: { accountname: searchQuery.value },
    });
  } else if (type === "post") {
    router.push({ name: "Post", params: { id: String(id) } });
  }
};

onMounted(() => {});
</script>
<!-- template 和 style 部分保持不變 -->

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
