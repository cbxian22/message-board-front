<script setup>
import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

import { ref, defineEmits, onMounted, onUnmounted } from "vue";
// import { useSocketStore } from "../stores/socketStore";
import { useAuthStore } from "../stores/authStore";
import axios from "axios";
import { useRouter } from "vue-router";
// const socketStore = useSocketStore();
const router = useRouter();
const comments = ref([]);
const emit = defineEmits();

const authStore = useAuthStore();
authStore.checkLoginStatus();

const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});

const openModal = (event, commentId) => {
  event.stopPropagation();

  // 如果當前 Modal 已開啟，則關閉它
  if (modalState.value[commentId]) {
    modalState.value[commentId] = false;
    return;
  }

  // 先關閉所有其他留言的 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });

  // 只打開當前點擊的留言的 Modal
  modalState.value[commentId] = true;
};

// 關閉 Modal
const closeModal = (event) => {
  const clickedInsideModal = Object.keys(modalRefs.value).some((id) => {
    const modal = modalRefs.value[id];
    const button = buttonRefs.value[id];

    return (
      modal && (modal.contains(event.target) || button.contains(event.target))
    );
  });

  if (!clickedInsideModal) {
    Object.keys(modalState.value).forEach((key) => {
      modalState.value[key] = false;
    });
  }
};

onMounted(() => {
  document.addEventListener("mousedown", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});

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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/authStore";

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
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

const authStore = useAuthStore();
authStore.checkLoginStatus();
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});

const openModal = (event, commentId) => {
  event.stopPropagation();

  // 如果當前 Modal 已開啟，則關閉它
  if (modalState.value[commentId]) {
    modalState.value[commentId] = false;
    return;
  }

  // 先關閉所有其他留言的 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });

  // 只打開當前點擊的留言的 Modal
  modalState.value[commentId] = true;
};

// 關閉 Modal
const closeModal = (event) => {
  const clickedInsideModal = Object.keys(modalRefs.value).some((id) => {
    const modal = modalRefs.value[id];
    const button = buttonRefs.value[id];

    return (
      modal && (modal.contains(event.target) || button.contains(event.target))
    );
  });

  if (!clickedInsideModal) {
    Object.keys(modalState.value).forEach((key) => {
      modalState.value[key] = false;
    });
  }
};

onMounted(() => {
  document.addEventListener("mousedown", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});

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
      <div class="info">
        <div class="info-span">
          <!--  -->
          <!--  -->
          <!--  -->
          <!--  -->
          <!-- <router-link to="/profile"> -->
          <span class="comment-author"> {{ comment.name }}</span>
          <!-- </router-link> -->
          <span class="comment-time"> {{ formatDate(comment.timestamp) }}</span>
        </div>

        <div class="info-modal">
          <button
            ref="buttonRefs"
            @click="openModal($event, comment.id)"
            class="info-link"
          >
            <img :src="Moreicon" alt="Moreicon" />
          </button>
          <div
            v-show="modalState[comment.id]"
            class="modal-overlay"
            ref="modalRefs"
          >
            <div class="modal-content" @click.stop>
              <ul>
                <li v-if="authStore.isLoggedIn">
                  <router-link to="/message" class="modal-link">
                    <img :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
                  </router-link>
                </li>
                <li v-if="authStore.isLoggedIn">
                  <button class="modal-link">
                    <img :src="Deleteicon" alt="Deleteicon" />
                    <span>刪除</span>
                  </button>
                </li>
                <li>
                  <button class="modal-link">
                    <img :src="Flagicon" alt="Flagicon" />
                    <span>檢舉</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 貼文內容 -->
      <p class="comment-content">{{ comment.content }}</p>

      <a
        v-if="comment.file_url"
        class="comment-file"
        :href="comment.file_url"
        >{{ comment.file_url }}</a
      >

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
  padding: 20px 25px 15px 25px;
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
  margin-left: -15px; /* 根據 padding 的值調整 */
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
  padding: 5px 10px;
}

.reply-link:hover,
.info-link:hover {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.info-span {
  display: flex;
  align-items: center;
}

.info-span .comment-author {
  color: #fff;
  font-weight: 900;
  transition: color 0.3s ease;
}

.light-mode .info-span .comment-author {
  color: #000;
  font-weight: 900;
  transition: color 0.3s ease;
}

.info-span .comment-time {
  margin-left: 10px;
  color: #707070;
}

.info-link {
  display: flex; /* 讓 a 內的內容可以對齊 */
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中（可選） */
  padding: 5px 10px;
}

.comment-content {
  margin-bottom: 5px;
}

.light-mode .info-link > img,
.light-mode .reply-link > img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
}

.info-modal {
  position: relative;
}

.modal-overlay {
  position: absolute;
  top: 110%;
  right: 0%;
  border: 0.5px solid #373737;
  border-radius: 10px;
  z-index: 1000;
  padding: 20px;
}

/* .modal-content {
  display: flex;
  flex-direction: column;
} */
.modal-content ul {
  list-style-type: none;
}

.modal-content li {
  width: 150px;
}

li:hover {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.modal-link {
  width: 100%;
  display: flex;
  flex: 1;
  padding: 5px 10px;
  margin: 5px;
}
.modal-link span {
  margin-left: 10px;
}

.dark-mode .modal-overlay {
  background: rgb(24, 24, 24);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode .modal-overlay {
  background: rgb(255, 255, 255);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
