<template>
  <div class="homepage">
    <h1 class="page-title">此網站將不斷更新...</h1>
    <!-- 新增留言按鈕 -->
    <button @click="goToMessagePage" class="add-comment-btn">新增留言</button>
    <div v-if="aru" class="aru">
      <h1>最新留言</h1>
      <div
        v-for="(message, index) in socketStore.messages"
        :key="index"
        class="comment"
      >
        <h3 class="comment-title">{{ message.data.title }}</h3>
        <p class="comment-content">{{ message.data.content }}</p>
        <!-- <div class="comment-meta">
          <span class="comment-author">貼文者: {{ comment.name }}</span>
          <span class="comment-time"
            >貼文時間: {{ formatDate(comment.timestamp) }}</span
          >
        </div> -->
        <!-- <p v-if="comment.file_url" class="comment-file">
          附件: <a :href="comment.file_url" target="_blank">下載</a>
        </p>
        <button @click="goToCommentPage(comment.id)" class="view-button">
          查看及回覆
        </button> -->
      </div>
    </div>
    <singleComment />
    <router-view></router-view>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useSocketStore } from "../stores/socketStore";
import singleComment from "../components/singleComment.vue";
const socketStore = useSocketStore();
import { useRouter } from "vue-router";
const router = useRouter();

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

// 跳轉到 MessageView
const goToMessagePage = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("請先登入以新增留言！");
    return;
  }
  router.push({ name: "Message" });
};

onMounted(() => {
  socketStore.connect(); // 確保 WebSocket 連線
});
</script>

<style scoped>
/* 整體容器 */
.homepage {
  max-width: 900px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 主標題 */
.page-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

/* 新增留言按鈕 */
.add-comment-btn {
  background-color: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1.5rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  transition: background-color 0.3s ease;
}

.add-comment-btn:hover {
  background-color: #0056b3;
}

/* 單一留言的樣式 (同樣延用 previous 設計) */
.single-comment {
  border: 1px solid #ececec;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 1.5rem;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.single-comment:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.comment-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  padding: 0 20px;
}

/* 每條留言的樣式 */
.comment {
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 800px;
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
  margin-bottom: 10px;
  line-height: 1.3;
}

/* 內容樣式 */
.comment-content {
  font-size: 1rem;
  margin-bottom: 15px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 作者和時間樣式 */
.comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
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

.aru {
  border-bottom: 1px solid black;
  padding: 20px 0 20px 0;
}
</style>
