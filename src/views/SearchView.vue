<!-- ChatHistory.vue -->
<template>
  <NavbarUp />
  <div class="container-box">
    <div class="container">
      <input
        v-model="searchQuery"
        class="search"
        placeholder="搜尋用戶或貼文..."
        @input="debouncedSearch"
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
import apiClient from "../stores/axiosConfig";
import { useMessage, useLoadingBar, useDialog } from "naive-ui";
import { debounce } from "lodash";

import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

const router = useRouter();
const dialog = useDialog();
const loadingBar = useLoadingBar();
const message = useMessage();

const searchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
let searchController = null; // 用於取消請求

// 搜尋用戶和貼文的核心邏輯
const handleSearch = async () => {
  // 如果輸入框為空，立即清空結果並取消之前的請求
  if (!searchQuery.value.trim()) {
    if (searchController) {
      searchController.abort(); // 取消正在進行的請求
    }
    searchResults.value = [];
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  searchResults.value = []; // 確保每次搜尋開始時清空結果

  // 创建新的 AbortController
  searchController = new AbortController();
  const signal = searchController.signal;

  try {
    // 1. 搜尋用戶（如果輸入的是用戶名）
    try {
      const userResponse = await apiClient.get(`/users/${searchQuery.value}`, {
        signal,
      });
      if (userResponse.data) {
        const user = userResponse.data;
        searchResults.value.push({
          id: user.id,
          name: user.accountname,
          avatar_url: user.avatar_url || "/default-avatar.png",
          type: "user",
        });
      }
    } catch (userErr) {
      if (userErr.response?.status !== 404) {
        console.error("搜尋用戶失敗:", userErr);
      }
    }

    // 2. 獲取所有貼文並過濾
    const postsResponse = await apiClient.get(`/posts`, { signal });
    console.log("所有貼文:", postsResponse.data);

    if (postsResponse.data && postsResponse.data.length > 0) {
      const posts = postsResponse.data
        .filter((post) => {
          const contentLower = post.content.toLowerCase();
          const queryLower = searchQuery.value.trim().toLowerCase();
          const matches = contentLower.includes(queryLower);
          if (!matches && post.content.includes("金磚")) {
            console.log("未匹配但包含金磚的貼文:", post);
          }
          return matches;
        })
        .map((post) => ({
          id: post.id,
          name:
            post.content.substring(0, 20) +
            (post.content.length > 20 ? "..." : ""),
          avatar_url: post.user_avatar || "/default-avatar.png",
          type: "post",
        }));
      console.log("過濾後的貼文:", posts);
      searchResults.value.push(...posts);
    } else {
      console.log("沒有返回任何貼文");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("搜尋請求被取消");
    } else {
      console.error("搜尋貼文失敗:", err);
      message.error("搜尋失敗，請稍後再試");
    }
  } finally {
    isSearching.value = false;
    searchController = null; // 重置控制器
  }
};

// 添加防抖，300ms 延遲
const debouncedSearch = debounce(handleSearch, 300);

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
