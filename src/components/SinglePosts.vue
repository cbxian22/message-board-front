<!-- <script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { usePostStore } from "../stores/usePostStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig"; // 引入 apiClient

import UpdatePostView from "./ModalUpdatePost.vue";

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const router = useRouter();
const emit = defineEmits();
const postStore = usePostStore();
const authStore = useAuthStore();
const dateStore = useDateStore();

const comments = ref([]);
const commentImages = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false); // 用於追踪點讚狀態
const selectedComment = ref(null); // 用於儲存當前選中的單一留言

// 打開 Modal
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
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get("/posts", { params: { userId } });
    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        visibility: comment.visibility,
        name: comment.user_name,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false, // 後端返回的用戶是否點贊
        replies: comment.replies,
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

// 獲取單一留言
const fetchSingleComment = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get(`/posts/${postId}`, {
      params: { userId },
    });
    if (response.status === 200) {
      const comment = response.data;
      selectedComment.value = {
        id: comment.id,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies,
      };
    } else {
      alert("無法獲取單一留言，數據格式不正確");
    }
  } catch (error) {
    console.error("取得單一留言錯誤:", error);
    alert("單一留言取得失敗，請檢查網絡或稍後再試");
  }
};

// 刪除留言
const handleDelete = async (postId) => {
  try {
    const userId = authStore.userId;
    const message = await postStore.deletePost(postId, userId);
    console.log(message);
    location.reload();
  } catch (error) {
    console.error("刪除失敗:", error.message);
    alert("刪除失敗: " + error.message); // 顯示具體錯誤訊息
  }
};

// 修改留言
const handleUpdate = async (postId) => {
  isOpenModal.value = true;
  await fetchSingleComment(postId); // 獲取單一留言
};

// 按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    return;
  }

  if (isLikeProcessing.value) {
    console.log("點讚操作正在進行中，忽略此次請求");
    return;
  }

  // 找到對應的 comment
  const comment = comments.value.find((c) => c.id === id);
  if (!comment) return;

  // 樂觀更新 UI（假設點讚成功）
  const previousLikes = comment.likes;
  const previousUserLiked = comment.userLiked;

  if (!comment.userLiked) {
    comment.likes += 1;
    comment.userLiked = true;
  } else {
    comment.likes = Math.max(comment.likes - 1, 0);
    comment.userLiked = false;
  }

  isLikeProcessing.value = true;

  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "post",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      comment.likes = response.data.likesCount;
    }
  } catch (error) {
    console.error(
      "提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
    comment.likes = previousLikes;
    comment.userLiked = previousUserLiked;
  } finally {
    isLikeProcessing.value = false;
  }
};

// 新增回覆
const handleReply = async (postId) => {
  router.push({ name: "CommentView", params: { postId } });
  await fetchSingleComment(postId);
};

// 跳轉到 CommentView
// const goToSinglePosts = (id) => {
//   router.push({ name: "SinglePosts", params: { id } });
// };

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
</script> -->

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { usePostStore } from "../stores/usePostStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

import UpdatePostView from "./ModalUpdatePost.vue";

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const router = useRouter();
const emit = defineEmits();
const postStore = usePostStore();
const authStore = useAuthStore();
const dateStore = useDateStore();

const comments = ref([]);
const commentImages = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false);
const selectedComment = ref(null);

// 打開 Modal
const openModal = (event, commentId) => {
  event.stopPropagation();
  if (modalState.value[commentId]) {
    modalState.value[commentId] = false;
    return;
  }
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
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

// 獲取主頁貼文
const fetchComments = async () => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const token = authStore.accessToken;
    console.log("fetchComments - userId:", userId, "token:", token); // 調試用日誌
    const response = await apiClient.get("/posts", {
      params: { userId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    console.log("fetchComments - 後端回應數量:", response.data.length); // 調試用日誌
    console.log("fetchComments - 後端回應:", response.data); // 調試用日誌
    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        visibility: comment.visibility, // 保留用於調試
        name: comment.user_name,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies || 0,
      }));
      emit("loaded");
    } else {
      console.error("數據格式不正確:", response.data);
      alert("無法獲取貼文，數據格式不正確");
    }
  } catch (error) {
    console.error(
      "取得貼文錯誤:",
      error.response ? error.response.data : error.message
    );
    alert("貼文取得失敗，請檢查網絡或稍後再試");
  }
};

// 獲取單一貼文
const fetchSingleComment = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get(`/posts/${postId}`, {
      params: { userId },
      headers: authStore.accessToken
        ? { Authorization: `Bearer ${authStore.accessToken}` }
        : {},
    });
    if (response.status === 200) {
      const comment = response.data;
      selectedComment.value = {
        id: comment.id,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies || 0,
      };
    } else {
      alert("無法獲取單一貼文，數據格式不正確");
    }
  } catch (error) {
    console.error("取得單一貼文錯誤:", error);
    alert("單一貼文取得失敗，請檢查網絡或稍後再試");
  }
};

// 刪除貼文
const handleDelete = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  try {
    const userId = authStore.userId;
    const message = await postStore.deletePost(postId, userId);
    console.log("刪除貼文成功:", message);
    await fetchComments(); // 重新獲取貼文
  } catch (error) {
    console.error("刪除失敗:", error.message);
    alert("刪除失敗: " + error.message);
  }
};

// 修改貼文
const handleUpdate = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  isOpenModal.value = true;
  await fetchSingleComment(postId);
};

// 按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  if (isLikeProcessing.value) {
    console.log("點讚操作正在進行中，忽略此次請求");
    return;
  }

  const comment = comments.value.find((c) => c.id === id);
  if (!comment) return;

  const previousLikes = comment.likes;
  const previousUserLiked = comment.userLiked;

  if (!comment.userLiked) {
    comment.likes += 1;
    comment.userLiked = true;
  } else {
    comment.likes = Math.max(comment.likes - 1, 0);
    comment.userLiked = false;
  }

  isLikeProcessing.value = true;
  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "post",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      comment.likes = response.data.likesCount;
    }
  } catch (error) {
    console.error(
      "按讚提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
    comment.likes = previousLikes;
    comment.userLiked = previousUserLiked;
  } finally {
    isLikeProcessing.value = false;
  }
};

// 新增回覆
const handleReply = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  await fetchSingleComment(postId);
  router.push({ name: "CommentView", params: { postId } });
};

onMounted(() => {
  fetchComments();
  document.addEventListener("mousedown", closeModal);

  // 圖片加載處理
  setTimeout(() => {
    commentImages.value.forEach((img) => {
      if (img) {
        img.onload = () => {
          if (img.naturalHeight > img.naturalWidth) {
            img.classList.add("tall-img");
          }
        };
      }
    });
  }, 0);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});
</script>

<template>
  <div
    v-for="(comment, index) in comments"
    :key="comment.id"
    :class="['comment-box', { 'last-comment': index === comments.length - 1 }]"
  >
    <div class="photo-content">
      <img :src="comment.user_avatar" alt="頭像" class="photo" />
    </div>

    <div class="comment">
      <div class="info">
        <div class="info-span">
          <router-link class="comment-author" :to="`/@${comment.name}`">
            {{ comment.name }}
          </router-link>

          <span class="comment-time">
            {{ dateStore.formatDate(comment.timestamp) }}</span
          >
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
                  <button class="modal-link" @click="handleUpdate(comment.id)">
                    <img class="icon" :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
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

      <div class="reply">
        <ul>
          <li>
            <div class="reply-count" @click="handlelike(comment.id)">
              <button class="reply-link">
                <img
                  :class="{ icon: !comment.userLiked }"
                  :src="comment.userLiked ? FavoriteRedicon : Favoriteicon"
                  alt="Like"
                />
              </button>
              <n-badge :value="comment.likes || 0" />
            </div>
          </li>
          <li>
            <div class="reply-count" @click="handleReply(comment.id)">
              <button class="reply-link">
                <img class="icon" :src="Replyicon" alt="Replyicon" />
              </button>
              <n-badge :value="comment.replies || 0" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <UpdatePostView v-model="isOpenModal" :comment="selectedComment" />
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
