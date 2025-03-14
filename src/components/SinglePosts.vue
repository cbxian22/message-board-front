<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge, useMessage, NImage, useDialog } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const router = useRouter();
const emit = defineEmits();
const authStore = useAuthStore();
const dateStore = useDateStore();
const message = useMessage();
const dialog = useDialog();

const comments = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isLikeProcessing = ref(false);

// 登入確認＿like
const checkTokenAndOpenModal = (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    emitter.emit("openLoginModal");
  } else {
    handlelike(id);
  }
};

// 貼文＿打開 Modal
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

// 貼文＿關閉 Modal
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

// 貼文＿檔案類型檢查
const isImage = (url) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

// 貼文＿檔案類型檢查
const isVideo = (url) => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

// 貼文＿獲取
const fetchComments = async () => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const token = authStore.accessToken;
    const response = await apiClient.get("/posts", {
      params: { userId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

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
        userLiked: comment.user_liked || false,
        replies: comment.replies || 0,
      }));
      emit("loaded");
    } else {
      console.error("數據格式不正確:", response.data);
      message.error("數據格式不正確");
    }
  } catch (error) {
    console.error(
      "取得貼文錯誤:",
      error.response ? error.response.data : error.message
    );
    message.error("貼文取得失敗，請檢查網絡或稍後再試");
  }
};

// 貼文＿刪除確認
const handleDeleteConfirm = (postId) => {
  // 關閉所有 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
  dialog.warning({
    content: "刪除貼文後回覆也將一併刪除，且無法復原！",
    positiveText: "刪除",
    negativeText: "取消",
    onPositiveClick: () => {
      handleDelete(postId);
    },
  });
};

// 貼文＿刪除
const handleDelete = async (postId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  try {
    const userId = authStore.userId;
    const response = await apiClient.delete(`/posts/${postId}/${userId}`);
    message.success("刪除貼文成功！");
    console.log(response);
    await fetchComments();
  } catch (error) {
    console.error("刪除失敗:", error.message);
    message.error("刪除失敗");
  }
};

// 貼文＿修改
const handleUpdate = async (postId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  // 關閉所有 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
  emitter.emit("openUpdateModal", postId);
};

// 貼文＿按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
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

// 貼文＿導向＿回覆
const handleReply = async (postId) => {
  router.push({ name: "Post", params: { id: postId } });
};

onMounted(async () => {
  fetchComments();
  document.addEventListener("mousedown", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});
</script>

<template>
  <div
    v-for="(comment, index) in comments"
    :key="comment.id"
    :class="[
      'comment-box',
      { 'with-border': comments.length > 0 && index !== comments.length - 1 },
    ]"
  >
    <div class="photo-content">
      <router-link :to="`/@${comment.name}`">
        <img :src="comment.user_avatar" alt="頭像" class="photo" />
      </router-link>
    </div>

    <div class="comment">
      <div class="info">
        <div class="info-span">
          <router-link class="comment-author" :to="`/@${comment.name}`">
            {{ comment.name }}
          </router-link>
          <span class="comment-time">
            {{ dateStore.formatDate(comment.timestamp) }}
          </span>
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
                    authStore.isLoggedIn &&
                    authStore.accountName === comment.name
                  "
                >
                  <button class="modal-link" @click="handleUpdate(comment.id)">
                    <img class="icon" :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
                  </button>
                </li>
                <li
                  v-if="
                    authStore.isLoggedIn &&
                    authStore.accountName === comment.name
                  "
                >
                  <button
                    class="modal-link"
                    @click="handleDeleteConfirm(comment.id)"
                  >
                    <img class="icon" :src="Deleteicon" alt="Deleteicon" />
                    <span>刪除</span>
                  </button>
                </li>
                <li v-if="authStore.accountName !== comment.name">
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
        <span v-if="comment.file_url">
          <n-image
            v-if="isImage(comment.file_url)"
            :src="comment.file_url"
            alt="comment media"
            lazy
            :preview-disabled="false"
            class="comment-image"
          >
            <template #placeholder>
              <div class="media-placeholder">Loading Image...</div>
            </template>
          </n-image>
          <div v-else-if="isVideo(comment.file_url)" class="video-wrapper">
            <video
              :src="comment.file_url"
              controls
              class="comment-video"
              preload="auto"
              @error="
                (e) => {
                  console.error('Video load error:', comment.file_url, e);
                  message.error('影片載入失敗，請檢查格式或網絡');
                }
              "
            />
          </div>
        </span>
      </div>

      <div class="reply">
        <ul>
          <li>
            <div
              class="reply-count"
              @click="checkTokenAndOpenModal(comment.id)"
            >
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
</template>

<style scoped>
.comment-box {
  padding: 20px 25px 15px 25px;
  display: flex;
  border-bottom: none;
}

.comment-box.with-border {
  border-bottom: 0.5px solid #373737;
}

/* .comment-box.last-comment {
  border-bottom: none !important;
} */

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

/* 更多按鈕樣式 */
.info-modal {
  position: relative;
}

.info-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
}

.dark-mode .modal-overlay {
  background: rgb(24, 24, 24);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode .modal-overlay {
  background: rgb(255, 255, 255);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 內容 文字 及 url */
.comment-content {
  margin-bottom: 10px;
}

.comment-content p {
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* url 圖片影片 */
.n-image {
  width: 75%;
  max-width: 75%;
}

:deep(.n-image img) {
  max-width: 100%;
  object-fit: contain;
  max-height: 350px;
}

.video-wrapper {
  width: 75%;
  max-width: 75%;
}

.comment-video {
  width: 100%;
  height: auto;
  object-fit: contain;
}
</style>
