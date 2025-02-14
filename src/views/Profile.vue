<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "@/stores/axiosConfig"; // 確保路徑正確
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const comments = ref([]);

// ✅ 透過 `authStore.userId` 獲取當前用戶的留言
const fetchUserComments = async () => {
  try {
    // const userId = 2;
    const userId = authStore.userId;
    if (!userId) {
      console.error("❌ 未登入，無法獲取留言");
      return;
    }

    const response = await axios.get(
      `https://message-board-server-7yot.onrender.com/api/posts/user/${userId}`
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url || null, // 若有檔案則顯示
      }));
    } else {
      console.warn("⚠️ 無法獲取留言，數據格式異常");
    }
  } catch (error) {
    console.error("❌ 取得留言錯誤:", error);
  }
};

// ✅ 計算屬性 - 只顯示當前用戶的留言
const userPosts = computed(() => comments.value);

// onMounted(() => {
//   if (!authStore.isLoggedIn) {
//     router.push("/login"); // 未登入時跳轉到登入頁面
//   } else {
//     fetchUserComments();
//   }
// });
onMounted(() => {
  fetchUserComments();
});
</script>

<template>
  <div class="profile-container">
    <h1>個人頁面</h1>
    <div class="profile-info">
      <!-- ✅ 使用 `authStore.userName` 顯示使用者名稱 -->
      <p><strong>使用者名稱：</strong> {{ authStore.userName }}</p>
    </div>

    <h2>我的留言</h2>
    <ul v-if="userPosts.length > 0" class="post-list">
      <li v-for="post in userPosts" :key="post.id" class="post-item">
        <!-- 顯示貼文內容 -->
        <p class="post-content">{{ post.content }}</p>
        <span class="post-time">{{ post.timestamp.toLocaleString() }}</span>
      </li>
    </ul>
    <p v-else class="no-posts">你還沒有發表過留言。</p>
  </div>
</template>

<style scoped>
/* 簡單樣式 */
.profile-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.post-list {
  list-style: none;
  padding: 0;
}

.post-item {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.post-content {
  margin: 0;
  font-size: 16px;
}

.post-time {
  font-size: 12px;
  color: #666;
  display: block;
  margin-top: 5px;
}

.no-posts {
  color: #888;
  font-style: italic;
}
</style>
