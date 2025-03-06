<script setup>
import { ref, watch, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge, useMessage, NImage } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";

// import UpdateReplyView from "./ModalUpdateReply.vue";

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

const props = defineProps({
  modelValue: Boolean,
  postId: {
    type: [String, Number],
    required: true,
  },
});

const replies = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false);
const selectedReplyId = ref(null);

// const replies = [
//   {
//     id: 1,
//     name: "xian",
//     user_avatar:
//       "https://storage.googleapis.com/message_board_storage/1000003286.jpg",
//     content: "有人知道這是哪裡嗎？",
//     timestamp: new Date("2025-02-22T19:06:51.000Z"),
//     file_url:
//       "https://storage.googleapis.com/message_board_storage/1000003286.jpg",
//     likes: 5,
//     userLiked: false,
//     replies: 2,
//   },
//   {
//     id: 2,
//     name: "jane",
//     user_avatar:
//       "https://storage.googleapis.com/message_board_storage/1000006562.jpg",
//     content: "這看起來像是巴黎鐵塔！",
//     timestamp: new Date("2025-02-22T20:15:30.000Z"),
//     file_url:
//       "https://storage.googleapis.com/message_board_storage/IMG_7103.jpeg",
//     likes: 3,
//     userLiked: true,
//     replies: 1,
//   },
//   {
//     id: 3,
//     name: "bob",
//     user_avatar:
//       "https://storage.googleapis.com/message_board_storage/20250221_123341575.JPG",
//     content: "應該是東京塔吧！",
//     timestamp: new Date("2025-02-22T21:30:00.000Z"),
//     file_url:
//       "https://storage.googleapis.com/message_board_storage/IMG_0197.jpeg",
//     likes: 10,
//     userLiked: false,
//     replies: 5,
//   },
//   {
//     id: 4,
//     name: "alice",
//     user_avatar:
//       "https://storage.googleapis.com/message_board_storage/DSC06831.jpeg",
//     content: "我覺得是上海的東方明珠！",
//     timestamp: new Date("2025-02-22T22:45:15.000Z"),
//     file_url: null,
//     likes: 8,
//     userLiked: true,
//     replies: 3,
//   },
//   {
//     id: 5,
//     name: "tom",
//     user_avatar:
//       "https://storage.googleapis.com/message_board_storage/IMG_2122.JPG",
//     content: "那是自由女神像吧！",
//     timestamp: new Date("2025-02-22T23:50:10.000Z"),
//     file_url:
//       "https://storage.googleapis.com/message_board_storage/IMG_2067.jpeg",
//     likes: 2,
//     userLiked: false,
//     replies: 0,
//   },
// ];

// 檔案類型檢查

const isImage = (url) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

const isVideo = (url) => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

// 打開 Modal 並禁用背景滾動
const openModal = (event, replyId) => {
  event.stopPropagation();

  // 如果當前 Modal 已開啟，則關閉它
  if (modalState.value[replyId]) {
    modalState.value[replyId] = false;
    return;
  }

  // 先關閉所有其他留言的 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });

  // 只打開當前點擊的留言的 Modal
  modalState.value[replyId] = true;
};

// 關閉 Modal 並恢復背景滾動
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

// 獲取單一貼文所有回覆
const fetchReplies = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const token = authStore.accessToken;
    const response = await apiClient.get("/replies", {
      params: { userId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      replies.value = response.data.map((reply) => ({
        id: reply.id,
        content: reply.content,
        timestamp: new Date(reply.created_at),
        file_url: reply.file_url,
        name: reply.replies_name,
        user_avatar: reply.user_avatar,
        likes: reply.likes || 0,
        userLiked: reply.user_liked || false,
        replies: reply.replies || 0,
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

// 刪除回覆
const handleDelete = async (replayId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  try {
    const userId = authStore.userId;
    const response = await apiClient.delete(`/replies/${replayId}/${userId}`);
    message.success("刪除回覆成功！");
    console.log(response);
    await fetchReplies();
  } catch (error) {
    console.error("刪除失敗:", error.message);
    message.error("刪除失敗");
  }
};

// 修改貼文
const handleUpdate = async (replayId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  selectedReplyId.value = replayId;
  isOpenModal.value = true;
};

// 處理貼文更新
const handleReplyUpdate = (updatedReply) => {
  const index = replies.value.findIndex((c) => c.id === updatedReply.id);
  if (index !== -1) {
    replies.value[index] = {
      ...replies.value[index],
      content: updatedReply.content,
      file_url: updatedReply.file_url,
    };
    isOpenModal.value = false;
    selectedReplyId.value = null;
  }
};

// 按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  if (isLikeProcessing.value) {
    console.log("點讚操作正在進行中，忽略此次請求");
    return;
  }

  const reply = replies.value.find((c) => c.id === id);
  if (!reply) return;

  const previousLikes = reply.likes;
  const previousUserLiked = reply.userLiked;

  if (!reply.userLiked) {
    reply.likes += 1;
    reply.userLiked = true;
  } else {
    reply.likes = Math.max(reply.likes - 1, 0);
    reply.userLiked = false;
  }

  isLikeProcessing.value = true;
  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "reply",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      reply.likes = response.data.likesCount;
    }
  } catch (error) {
    console.error(
      "按讚提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
    reply.likes = previousLikes;
    reply.userLiked = previousUserLiked;
  } finally {
    isLikeProcessing.value = false;
  }
};

onMounted(async () => {
  if (props.postId) {
    fetchReplies(props.postId);
  }
  document.addEventListener("mousedown", closeModal);
  emitter.on("updateReply", handleReplyUpdate); // 監聽更新事件
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
  emitter.off("updateReply", handleReplyUpdate); // 移除事件監聽
});

watch(
  () => props.postId,
  (newPostId) => {
    if (newPostId) {
      fetchReplies(newPostId);
    }
  }
);
</script>

<template>
  <div
    v-for="(reply, index) in replies"
    :key="reply.id"
    :class="['reply-box', { 'last-reply': index === replies.length - 1 }]"
  >
    <div class="photo-content">
      <router-link :to="`/@${reply.name}`">
        <img :src="reply.user_avatar" alt="頭像" class="photo" />
      </router-link>
    </div>

    <div class="reply">
      <div class="info">
        <div class="info-span">
          <router-link class="reply-author" :to="`/@${reply.name}`">
            {{ reply.name }}
          </router-link>
          <span class="reply-time">
            {{ dateStore.formatDate(reply.timestamp) }}
          </span>
        </div>

        <div class="info-modal">
          <button
            ref="buttonRefs"
            @click="openModal($event, reply.id)"
            class="info-link"
          >
            <img class="icon" :src="Moreicon" alt="Moreicon" />
          </button>
          <div
            v-show="modalState[reply.id]"
            class="modal-overlay"
            ref="modalRefs"
          >
            <div class="modal-content" @click.stop>
              <ul>
                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === reply.name
                  "
                >
                  <button class="modal-link" @click="handleUpdate(reply.id)">
                    <img class="icon" :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
                  </button>
                </li>
                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === reply.name
                  "
                >
                  <button class="modal-link" @click="handleDelete(reply.id)">
                    <img class="icon" :src="Deleteicon" alt="Deleteicon" />
                    <span>刪除</span>
                  </button>
                </li>
                <li v-if="authStore.userName !== reply.name">
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

      <div class="reply-content">
        <p>{{ reply.content }}</p>
        <span v-if="reply.file_url">
          <n-image
            v-if="isImage(reply.file_url)"
            :src="reply.file_url"
            alt="reply media"
            lazy
            :preview-disabled="false"
            class="reply-image"
          >
            <template #placeholder>
              <div class="media-placeholder">Loading Image...</div>
            </template>
          </n-image>
          <div v-else-if="isVideo(reply.file_url)" class="video-wrapper">
            <video
              :src="reply.file_url"
              controls
              class="reply-video"
              preload="auto"
              @error="
                (e) => {
                  console.error('Video load error:', reply.file_url, e);
                  message.error('影片載入失敗，請檢查格式或網絡');
                }
              "
            />
          </div>
        </span>
      </div>

      <div class="reply-section">
        <ul>
          <li>
            <div class="reply-count" @click="handlelike(reply.id)">
              <button class="reply-link">
                <img
                  :class="{ icon: !reply.userLiked }"
                  :src="reply.userLiked ? FavoriteRedicon : Favoriteicon"
                  alt="Like"
                />
              </button>
              <n-badge :value="reply.likes || 0" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <!-- <UpdateReplyView v-model="isOpenModal" :post-id="selectedReplyId" /> -->
</template>

<style scoped>
.reply-box {
  padding: 20px 25px 15px 25px;
  display: flex;
}
.reply-box.last-reply {
  border-bottom: none !important;
}

.photo-content {
  margin-right: 15px;
}

.reply-section {
  display: flex;
  margin-left: -10px;
  align-items: center;
}

.reply {
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

.reply-section ul {
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

.info-span .reply-author {
  color: #fff;
  font-weight: 900;
  transition: color 0.3s ease;
}

.info-span .reply-author:hover {
  text-decoration: underline;
}

.light-mode .info-span .reply-author {
  color: #000;
  font-weight: 900;
  transition: color 0.3s ease;
}

.info-span .reply-time {
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
.reply-content {
  margin-bottom: 10px;
}

.reply-content p {
  margin-bottom: 10px;
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

.reply-video {
  width: 100%;
  height: auto;
  object-fit: contain;
}
</style>
