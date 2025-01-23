<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
const router = useRouter();
const comments = ref([]);

// 獲取留言
const fetchComments = async () => {
  try {
    const response = await axios.get(
      "https://message-board-server-7yot.onrender.com/api/posts"
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        title: comment.title,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url, // 如有顯示
      }));
    } else {
      alert("無法獲取留言，數據格式不正確");
    }
  } catch (error) {
    console.error("取得留言錯誤:", error);
    alert("留言取得失敗，請檢查網絡或稍後再試");
  }
};

// 格式化時間
const formatDate = (date) => {
  if (!date) return "未知時間";
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("zh-TW", options);
};

// 跳轉到 CommentView
const goToCommentPage = (id) => {
  router.push({ name: "Comment", params: { id } });
};

// 組件加載時獲取留言
onMounted(fetchComments);
</script>

<template>
  <div class="comment-list">
    <div v-for="comment in comments" :key="comment.id" class="comment">
      <h3 class="comment-title">{{ comment.title }}</h3>
      <p class="comment-content">{{ comment.content }}</p>
      <div class="comment-meta">
        <span class="comment-author">貼文者: {{ comment.name }}</span>
        <span class="comment-time"
          >貼文時間: {{ formatDate(comment.timestamp) }}</span
        >
      </div>
      <p v-if="comment.file_url" class="comment-file">
        附件: <a :href="comment.file_url" target="_blank">下載</a>
      </p>
      <button @click="goToCommentPage(comment.id)" class="view-button">
        查看及回覆
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 整體頁面容器 */
.comment-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  padding: 0 20px;
}

/* 每條留言的樣式 */
.comment {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 當鼠標懸停在留言上時 */
.comment:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

/* 標題樣式 */
.comment-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.3;
}

/* 內容樣式 */
.comment-content {
  font-size: 1rem;
  color: #555;
  margin-bottom: 15px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  --webkit-box-orient: vertical;
  --webkit-line-clamp: 4;
}

/* 作者和時間樣式 */
.comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 15px;
}

.comment-author {
  font-weight: 600;
}

.comment-time {
  font-style: italic;
}

/* 附件樣式 */
.comment-file {
  font-size: 0.9rem;
  color: #007bff;
  margin-top: 10px;
}

.comment-file a {
  text-decoration: none;
  color: #007bff;
}

.comment-file a:hover {
  text-decoration: underline;
}

/* 按鈕樣式 */
.view-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.view-button:hover {
  background-color: #0056b3;
  transform: translateY(-3px);
}
</style>
