<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";

import { NBadge } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { usePostStore } from "../stores/usePostStore";
import { useRouter } from "vue-router";
import axios from "axios";

import Message from "../components/MessageView.vue";

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const router = useRouter();
const comments = ref([]);
const emit = defineEmits();
const commentImages = ref([]);
const authStore = useAuthStore();
const postStore = usePostStore();

const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);

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
    );
    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false, // 後端返回的用戶是否點贊
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

// 刪除留言
const handleDelete = async (postId) => {
  try {
    const userId = authStore.userId;
    const message = await postStore.deletePost(postId, userId);
    console.log(message);
    location.reload();
  } catch {
    console.log(刪除失敗);
  }
};

// 修改留言
const handleUpdate = async (postId) => {
  try {
    const userId = authStore.userId;
    const message = await postStore.updatePost(
      postId,
      userId,
      content,
      fileUrl
    );
    console.log(message);
    // location.reload();
    await postStore.fetchPosts(); // 重新獲取貼文，而不是整個刷新頁面
  } catch {
    console.log(更新失敗);
  }
};

// 按讚
const handlelike = async (id) => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    alert("請先登入！");
    return;
  }

  try {
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/like/${userId}`,
      { targetType: "post", targetId: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200) {
      // 找到對應的 comment
      const comment = comments.value.find((c) => c.id === id);
      if (!comment) return;

      // 初始化 likes 屬性（如果不存在）
      if (!comment.likes) comment.likes = 0;

      // 根據後端返回的動作更新 likes
      if (response.data.action === "liked") {
        comment.likes += 1;
        comment.userLiked = true;
      } else if (response.data.action === "unliked") {
        comment.likes = Math.max(comment.likes - 1, 0);
        comment.userLiked = false;
      }

      // 可選：使用後端返回的最新點贊數（更準確）
      if (response.data.likesCount !== undefined) {
        comment.likes = response.data.likesCount;
      }
    }
  } catch (error) {
    const errorMsg = error.response ? error.response.data.error : error.message;
    console.error("提交錯誤:", errorMsg);
    alert(errorMsg);
  }
};

// checkTokenAndOpenModal
const OpenModal = () => {
  isOpenModal.value = true;
};

// 格式化時間
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
const goToSinglePosts = (id) => {
  router.push({ name: "SinglePosts", params: { id } });
};

// 頁面加載時執行
onMounted(() => {
  fetchComments();
});

// 確保對每一個圖片都加載後進行判斷
onMounted(() => {
  commentImages.value.forEach((img) => {
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth) {
        img.classList.add("tall-img"); // 直向圖片加上類別
      }
    };
  });
});
</script>

<!-- <script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import { NBadge } from "naive-ui";
import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
const commentImages = ref([]);
const value = ref(0);
const unlike = ref(true);
const comments = ref([
  {
    id: 1,
    photo: "https://fakeimg.pl/300/",
    title: "這是第一個留言標題",
    content: "這是第一個留言的內容，討論一些有趣的話題。",
    name: "小明",
    timestamp: 1675886200000,
    file_url:
      "https://storage.googleapis.com/message_board_storage/default_profile.jpg",
  },
  {
    id: 2,
    photo: "https://fakeimg.pl/300/",
    title: "第二個留言標題，討論新技術",
    content: "這是第二個留言的內容，分享一些關於最新技術的見解。",
    name: "小華",
    timestamp: 1675972600000,
    file_url:
      "https://storage.googleapis.com/message_board_storage/%E6%88%AA%E5%9C%96%202025-01-12%20%E6%99%9A%E4%B8%8A10.46.29.png",
  },
  {
    id: 3,
    photo: "https://fakeimg.pl/300/",
    title: "第三個留言標題，問問題",
    content: "這是第三個留言的內容，這裡有一些問題等待解答。",
    name: "小李",
    timestamp: 1676059000000,
    file_url:
      "https://storage.googleapis.com/message_board_storage/%E6%88%AA%E5%9C%96%202025-02-17%20%E4%B8%8B%E5%8D%882.46.25.png",
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
onMounted(() => {
  // 確保對每一個圖片都加載後進行判斷
  commentImages.value.forEach((img) => {
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth) {
        img.classList.add("tall-img"); // 直向圖片加上類別
      }
    };
  });
});
</script> -->

<template>
  <div
    v-for="(comment, index) in comments"
    :key="comment.id"
    :class="['comment-box', { 'last-comment': index === comments.length - 1 }]"
  >
    <!-- 頭貼 -->
    <div class="photo-content">
      <img :src="comment.user_avatar" alt="頭像" class="photo" />
    </div>
    <!-- 內文 -->
    <div class="comment">
      <!-- 貼文資訊 -->
      <div class="info">
        <div class="info-span">
          <router-link class="comment-author" :to="`/@${comment.name}`">
            {{ comment.name }}
          </router-link>

          <span class="comment-time"> {{ formatDate(comment.timestamp) }}</span>
        </div>

        <div class="info-modal">
          <button
            ref="buttonRefs"
            @click="openModal($event, comment.id)"
            class="info-link"
          >
            <img class="icon" :src="Moreicon" alt="Moreicon" />
          </button>
          <div
            v-show="modalState[comment.id]"
            class="modal-overlay"
            ref="modalRefs"
          >
            <div class="modal-content" @click.stop>
              <ul>
                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === comment.name
                  "
                >
                  <button class="modal-link" @click="OpenModal">
                    <!-- <button class="modal-link" @click="handleUpdate(comment.id)"> -->
                    <!-- <router-link to="/message" class="modal-link"> -->
                    <img class="icon" :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
                    <!-- </router-link> -->
                  </button>
                </li>

                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === comment.name
                  "
                >
                  <button class="modal-link" @click="handleDelete(comment.id)">
                    <img class="icon" :src="Deleteicon" alt="Deleteicon" />
                    <span>刪除</span>
                  </button>
                </li>
                <li v-if="authStore.userName !== comment.name">
                  <button class="modal-link">
                    <img class="icon" :src="Flagicon" alt="Flagicon" />
                    <span>檢舉</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <!--  -->
      <!-- 貼文內容 -->
      <div class="comment-content">
        <p>{{ comment.content }}</p>
        <span v-if="comment.file_url" class="comment-file">
          <img
            :src="comment.file_url"
            alt="comment.file_url"
            ref="commentImages"
          />
        </span>
      </div>

      <!-- 回覆功能 -->
      <div class="reply">
        <ul>
          <li>
            <div class="reply-count" @click="handlelike(comment.id)">
              <button class="reply-link">
                <img
                  class="icon"
                  :src="comment.userLiked ? FavoriteRedicon : Favoriteicon"
                  alt="Like"
                  @click="handlelike(comment.id)"
                />
              </button>
              <n-badge :value="comment.likes || 0" />
            </div>
          </li>
          <li>
            <div class="reply-count">
              <button @click="goToSinglePosts(comment.id)" class="reply-link">
                <img class="icon" :src="Replyicon" alt="Replyicon" />
              </button>
              <!-- <n-badge :value="value" /> -->
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <Message v-model="isOpenModal" />
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
  height: 50px;
  object-fit: cover;
}

.reply {
  margin-left: -10px;
}

.reply ul {
  display: flex;
  flex-direction: row;
  list-style-type: none;
}

.reply-count {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 5px;
  margin-right: 10px;
  cursor: pointer;
}

.reply-count .n-badge {
  --n-color: transition !important;
}

.reply-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-count:hover,
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

.info-span .comment-author:hover {
  text-decoration: underline;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
}

.comment-content {
  margin-bottom: 10px;
}

.comment-content p {
  margin-bottom: 10px;
}

.info-modal {
  position: relative;
}

/* url 圖片 */

.comment-file {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
}

.comment-file img {
  max-width: 75%;
  height: auto;
  object-fit: cover;
}
/* 直向 */
.tall-img {
  width: auto;
  max-height: 250px;
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
