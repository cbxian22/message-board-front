<script setup>
import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
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
        // title: comment.title,
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
// const formatDate = (date) => {
//   if (!date) return "未知時間";
//   const options = {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   };
//   return new Date(date).toLocaleString("zh-TW", options);
// };
const formatDate = (date) => {
  if (!date) return "未知時間";

  const timestamp = typeof date === "string" ? parseInt(date, 10) : date; // 確保是數字類型
  const currentTime = new Date();
  const inputDate = new Date(timestamp); // 轉換成 Date 物件
  const diffInSeconds = Math.floor((currentTime - inputDate) / 1000); // 轉換秒
  const diffInMinutes = Math.floor(diffInSeconds / 60); // 轉換分鐘
  const diffInHours = Math.floor(diffInMinutes / 60); // 轉換小時
  const diffInDays = Math.floor(diffInHours / 24); // 轉換天數
  const diffInWeeks = Math.floor(diffInDays / 7); // 轉換週

  if (diffInSeconds < 60) {
    return "現在";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘`;
  } else if (diffInHours < 24) {
    return `${diffInHours} 小時`;
  } else if (diffInDays < 7) {
    return `${diffInDays} 天`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} 週`;
  } else {
    return inputDate.toLocaleDateString("zh-TW"); // 超過 4 週顯示日期
  }
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
import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";

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
  <div
    v-for="(comment, index) in comments"
    :key="comment.id"
    :class="['comment-box', { 'last-comment': index === comments.length - 1 }]"
  >
    <!-- 頭貼 -->
    <div class="photo-content">
      <img
        :src="comment.photo || 'https://fakeimg.pl/50/'"
        alt="頭像"
        class="photo"
      />
    </div>
    <!-- 內文 -->
    <div class="comment">
      <!-- 貼文資訊 -->
      <div class="">
        <span class="comment-author"> {{ comment.name }}</span>
        <span class="comment-time"> {{ formatDate(comment.timestamp) }}</span>
      </div>

      <!-- 貼文內容 -->
      <p class="comment-content">{{ comment.content }}</p>
      <!-- <p v-if="comment.file_url" class="comment-file">
        附件: <a :href="comment.file_url" target="_blank">下載</a>
      </p> -->

      <!-- 回覆功能 -->
      <div class="reply">
        <ul>
          <li>
            <button @click="" class="reply-link">
              <img :src="Favoriteicon" alt="Favoriteicon" />
            </button>
          </li>
          <li>
            <button @click="goToCommentPage(comment.id)" class="reply-link">
              <img :src="Replyicon" alt="Replyicon" />
            </button>
          </li>
        </ul>
      </div>
      <!-- 內文 comment -->
    </div>
  </div>
</template>

<style scoped>
.comment-box {
  padding: 40px 20px 15px 20px;
  border-bottom: 0.5px solid #373737;
  display: flex;
}
.comment-box.last-comment {
  border-bottom: none !important;
}

.photo-content {
  margin-right: 15px;
}

.comment {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.photo {
  border-radius: 50%;
  width: 50px;
}

.reply {
}
.reply ul {
  display: flex;
  flex-direction: row;
  list-style-type: none;
}

.reply-link {
  display: flex; /* 讓 a 內的內容可以對齊 */
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中（可選） */
  padding: 5px 20px 5px 0px;
}
</style>
