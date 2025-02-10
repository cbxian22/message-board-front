<script setup>
import { ref, onMounted, defineEmits } from "vue";
// import { useSocketStore } from "../stores/socketStore";
import axios from "axios";
import { useRouter } from "vue-router";
// const socketStore = useSocketStore();
const router = useRouter();
const comments = ref([]);
const emit = defineEmits();

// 獲取留言
const fetchComments = async () => {
  try {
    const response = await axios.get(
      "https://message-board-server-7yot.onrender.com/api/posts"
      // "http://localhost:3000/api/posts"
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
      emit("loaded");
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

// 頁面加載時執行
onMounted(() => {
  fetchComments();
});
</script>

<!-- <script setup>
import { ref } from "vue";

const comments = ref([
  {
    id: 1,
    photo: "https://fakeimg.pl/300/",
    title: "這是第一個留言標題",
    content: "這是第一個留言的內容，討論一些有趣的話題。",
    name: "小明",
    timestamp: 1675886200000,
    file_url: "https://example.com/file1.pdf",
  },
  {
    id: 2,
    photo: "https://fakeimg.pl/300/",
    title: "第二個留言標題，討論新技術",
    content: "這是第二個留言的內容，分享一些關於最新技術的見解。",
    name: "小華",
    timestamp: 1675972600000,
    file_url: "",
  },
  {
    id: 3,
    photo: "https://fakeimg.pl/300/",
    title: "第三個留言標題，問問題",
    content: "這是第三個留言的內容，這裡有一些問題等待解答。",
    name: "小李",
    timestamp: 1676059000000,
    file_url: "https://example.com/file2.jpg",
  },
  {
    id: 4,
    photo: "https://fakeimg.pl/300/",
    title: "聊天與討論，第四個留言",
    content: "這是第四個留言的內容，這裡是關於一些生活中的趣事。",
    name: "小張",
    timestamp: 1676145400000,
    file_url: "",
  },
]);

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // 格式化日期時間
};

const goToCommentPage = (id) => {
  console.log(`跳轉到留言頁面，留言ID: ${id}`);
};
</script> -->

<template>
  <div v-for="comment in comments" :key="comment.id" class="comment-box">
    <div class="photo-content">
      <img
        :src="comment.photo || 'https://fakeimg.pl/50/'"
        alt="頭像"
        class="photo"
      />
    </div>
    <div class="comment">
      <span class="comment-time"
        >貼文時間: {{ formatDate(comment.timestamp) }}</span
      >
      <h3 class="comment-title">{{ comment.title }}</h3>
      <p class="comment-content">{{ comment.content }}</p>
      <!-- <span class="comment-author"> {{ comment.name }}</span> -->

      <p v-if="comment.file_url" class="comment-file">
        附件: <a :href="comment.file_url" target="_blank">下載</a>
      </p>
      <div>
        <button @click="goToCommentPage(comment.id)" class="view-button">
          回覆
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-box {
  padding: 20px;
  border-bottom: 0.5px solid rgba(170, 170, 170, 0.5);
  display: flex;
  background-color: rgb(16, 16, 16);
}

.photo-content {
  background-color: transparent;
  margin-right: 15px;
}

.comment {
  flex: 1; /* 讓 comment 占滿剩餘空間 */
}
.comment > *,
div {
  background-color: transparent;
}
.photo {
  border-radius: 50%;
  width: 50px;
}
</style>
