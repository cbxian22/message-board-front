<!-- <script setup>
import { ref, nextTick, watch, computed } from "vue";
import { NButton, useLoadingBar } from "naive-ui";
import { useSocketStore } from "../stores/socketStore";
import { usePostStore } from "../stores/usePostStore";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import apiClient from "../stores/axiosConfig"; // 引入 apiClient

import Backicon from "../assets/Backicon.svg";
import Noteicon from "../assets/Noteicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const postStore = usePostStore();
const dateStore = useDateStore();
const authStore = useAuthStore();
const props = defineProps({
  modelValue: Boolean,
  comment: Object,
});

const emit = defineEmits(["update:modelValue"]);
const socketStore = useSocketStore();
const loadingBar = useLoadingBar();

const content = ref("");
const textarea = ref(null); // 取得 textarea DOM 節點
const prevHeight = ref("auto"); // 儲存上一次高度
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);

// 當收到 comment 時，初始化表單資料
watch(
  () => props.comment,
  (newComment) => {
    if (newComment) {
      content.value = newComment.content || "";
      fileUrl.value = newComment.file_url || null; // 直接使用後端 URL
      file.value = null; // 重置 file，避免誤認為有新檔案
    }
  },
  { immediate: true }
);

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

// 檢查是否啟用提交按鈕
const isSubmitDisabled = computed(() => {
  // 如果沒有原始資料（props.comment），只要有內容就啟用
  if (!props.comment) {
    return !(content.value.trim() || file.value);
  }

  // 比較當前值與原始值
  const isContentUnchanged = content.value === (props.comment.content || "");
  const isFileUrlUnchanged = fileUrl.value === (props.comment.file_url || null);
  const noNewFile = !file.value;

  // 如果內容和圖片都未改變，且沒有新上傳檔案，則禁用
  return isContentUnchanged && isFileUrlUnchanged && noNewFile;
});

// 當收到 comment 時，初始化表單資料
watch(
  () => props.comment,
  (newComment) => {
    if (newComment) {
      content.value = newComment.content || "";
      fileUrl.value = newComment.file_url || null; // 直接使用後端 URL
      file.value = null; // 重置 file，避免誤認為有新檔案
    }
  },
  { immediate: true }
);

// 獲取 <input type="file">
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 檢查檔案上傳處理，並顯示預覽
const handleFileUpload = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    console.log("檔案已選擇:", selectedFile.name);
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileUrl.value = e.target.result;
      };
      reader.readAsDataURL(selectedFile);
    }
    file.value = selectedFile;
  }
};

// 取消檔案預覽，重設檔案選擇
const cancelFilePreview = () => {
  fileUrl.value = null; // 清除圖片預覽 URL
  file.value = null; // 清除檔案
};

// 獨立處理圖片上傳
const uploadFile = async () => {
  if (!file.value) return fileUrl.value || null; // 如果沒有新檔案，保留現有 fileUrl

  try {
    console.log("開始上傳檔案...");
    const { data } = await apiClient.get("/upload", {
      params: { filename: file.value.name, contentType: file.value.type },
    });

    await apiClient.put(data.uploadUrl, file.value, {
      headers: { "Content-Type": file.value.type },
    });

    console.log("檔案上傳成功:", data.fileUrl);
    return data.fileUrl;
  } catch (error) {
    console.error("檔案上傳失敗:", error);
    return null;
  }
};

// 提交上傳資料庫
const handleMessage = async () => {
  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    return;
  }

  loadingBar.start();

  try {
    const uploadedFileUrl = await uploadFile(); // 獨立處理圖片上傳
    const response = await apiClient.put(
      `/posts/${props.comment.id}/${authStore.userId}`,
      {
        content: content.value,
        fileUrl: uploadedFileUrl,
      }
    );

    if (response.status === 200) {
      content.value = "";
      file.value = null;
      fileUrl.value = null;
      emit("update:modelValue", false);
      location.reload();
    } else {
      alert("留言提交失敗");
      loadingBar.error();
    }
  } catch (error) {
    console.error("留言提交錯誤:", error);
    alert("留言提交失敗");
  } finally {
    loadingBar.finish();
  }
};

// 處理 Modal 關閉的邏輯
const handleModalClose = (newValue) => {
  if (content.value.trim() || file.value) {
    if (!window.confirm("確認要關閉並清除內容嗎？")) return;
  }
  content.value = "";
  file.value = null;
  fileUrl.value = null;
  emit("update:modelValue", false);
};

// 監聽 Modal 開啟，恢復高度
watch(content, () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = "auto";
      textarea.value.style.height = `${textarea.value.scrollHeight}px`;
    }
  });
});
</script>

<template>
  <NavbarUp />
  <div class="container-box">

    <div class="back-icon">
      <router-link to="/">
        <img :src="Backicon" alt="Backicon" />
      </router-link>
    </div>

    <div class="container"></div>
  </div>
  <Navbar />
</template>

<style scoped>
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin-bottom: 100px;
  margin-top: calc(100px - 44px);
}

.back-icon {
  margin: 0 0 20px 5px;
  display: flex;
}

.hidden {
  visibility: hidden;
  pointer-events: none;
}

.back-icon a {
  display: flex;
}


.light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
}
</style> -->

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge, useMessage, NImage } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
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
const authStore = useAuthStore();
const dateStore = useDateStore();
const message = useMessage();

const comments = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false);
const selectedComment = ref(null);

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

// 獲取主頁貼文
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
      message.error("無法獲取單一貼文，數據格式不正確");
    }
  } catch (error) {
    console.error("取得單一貼文錯誤:", error);
    message.error("單一貼文取得失敗，請檢查網絡或稍後再試！");
  }
};

// 刪除貼文
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

// 修改貼文
const handleUpdate = async (postId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  isOpenModal.value = true;
  await fetchSingleComment(postId);
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
    message.error("請先登入！");
    return;
  }
  await fetchSingleComment(postId);
  router.push({ name: "CommentView", params: { postId } });
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
    :class="['comment-box', { 'last-comment': index === comments.length - 1 }]"
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
