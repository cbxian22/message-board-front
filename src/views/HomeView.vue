<template>
  <div class="container-box">
    <h1 class="page-title">此網站將不斷更新...</h1>
    <div class="container">
      <!-- 新增留言按鈕 -->
      <!-- <button @click="goToMessagePage" class="add-comment-btn">新增留言</button> -->

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
    </div>
  </div>
  <Navbar />
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useSocketStore } from "../stores/socketStore";
import singleComment from "../components/singleComment.vue";
import Navbar from "../components/Navbar.vue";
const socketStore = useSocketStore();
import { useRouter } from "vue-router";
const router = useRouter();

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

onMounted(() => {
  socketStore.connect(); // 確保 WebSocket 連線
});
</script>

<style scoped>
/* 整體容器 */
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
}

/* 主標題 */
.page-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.container {
  background: rgb(16, 16, 16);
  border: 0.5px solid #aaa;
  border-radius: 8px;
}

.aru {
  border-bottom: 1px solid black;
  padding: 20px 0 20px 0;
}
</style>
