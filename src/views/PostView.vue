<script setup>
import {
  ref,
  watch,
  computed,
  defineEmits,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NBadge,
  useMessage,
  NImage,
  NButton,
  useLoadingBar,
  useDialog,
} from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";
import SingleReplies from "../components/SingleReplies.vue";

import Backicon from "../assets/Backicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const route = useRoute();
const router = useRouter();
const emit = defineEmits(["updatePost", "deletePost", "likePost", "newReply"]);
const authStore = useAuthStore();
const dateStore = useDateStore();
const message = useMessage();
const dialog = useDialog();
const loadingBar = useLoadingBar();

const post = ref(null);
const isLikeProcessing = ref(false);
const textareaRef = ref(null);
const content = ref("");
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);
const isModalOpen = ref(false);

// 登入確認＿like
const checkTokenAndOpenModal = (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    emitter.emit("openLoginModal");
  } else {
    handlelike(id);
  }
};

// 貼文＿打開 Modal
const openModal = (event) => {
  event.stopPropagation();
  isModalOpen.value = !isModalOpen.value;
};

// 貼文＿關閉 Modal
const closeModal = (event) => {
  const modalContent = event.target.closest(".modal-content");
  const infoLink = event.target.closest(".info-link");
  if (!modalContent && !infoLink) {
    isModalOpen.value = false;
  }
};

// 檔案類型檢查
const getFileType = (fileOrUrl) => {
  if (typeof fileOrUrl === "string") {
    const ext = fileOrUrl.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
      return "image";
    if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  } else if (fileOrUrl?.type) {
    if (fileOrUrl.type.startsWith("image/")) return "image";
    if (fileOrUrl.type.startsWith("video/")) return "video";
  }
  return null;
};
const isImage = (fileUrl) => getFileType(fileUrl) === "image";
const isVideo = (fileUrl) => getFileType(fileUrl) === "video";
const isPreviewImage = computed(() => getFileType(file.value) === "image");
const isPreviewVideo = computed(() => getFileType(file.value) === "video");

// 貼文＿獲取單一
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
      post.value = {
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
      console.error("無法獲取單一貼文，數據格式不正確");
      router.replace("/not-found");
      return;
    }
  } catch (error) {
    console.error("取得單一貼文錯誤:", error);
    router.replace("/not-found");
  }
};

// 貼文＿刪除確認
const handleDeleteConfirm = (postId) => {
  // 關閉 Modal
  isModalOpen.value = false;

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
    await apiClient.delete(`/posts/${postId}/${userId}`);
    message.success("刪除貼文成功！");
    emit("deletePost", postId); // 通知父組件更新數據
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
  isModalOpen.value = false;
  emitter.emit("openUpdateModal", postId);
};

// 貼文＿按讚
// const handlelike = async (id) => {
//   if (!authStore.userId || !authStore.accessToken) {
//     message.error("請先登入！");
//     return;
//   }
//   if (isLikeProcessing.value) {
//     console.log("點讚操作正在進行中，忽略此次請求");
//     return;
//   }

//   isLikeProcessing.value = true;
//   try {
//     const response = await apiClient.post(`/like/${authStore.userId}`, {
//       targetType: "post",
//       targetId: id,
//     });
//     if (response.status === 200 && response.data.likesCount !== undefined) {
//       emit("likePost", {
//         id,
//         likes: response.data.likesCount,
//         userLiked: !post.value.userLiked,
//       });
//       post.value.likes = response.data.likesCount;
//       post.value.userLiked = !post.value.userLiked;
//     }
//   } catch (error) {
//     console.error(
//       "按讚提交錯誤:",
//       error.response ? error.response.data.error : error.message
//     );
//   } finally {
//     isLikeProcessing.value = false;
//   }
// };
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

  // 儲存之前的狀態以便失敗時回滾
  const previousLikes = post.value.likes;
  const previousUserLiked = post.value.userLiked;

  // 立即更新前端顯示（樂觀更新）
  if (!post.value.userLiked) {
    post.value.likes += 1;
    post.value.userLiked = true;
  } else {
    post.value.likes = Math.max(post.value.likes - 1, 0);
    post.value.userLiked = false;
  }

  isLikeProcessing.value = true;

  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "post",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      // 使用伺服器返回的最新數據更新
      post.value.likes = response.data.likesCount;
      emit("likePost", {
        id,
        likes: response.data.likesCount,
        userLiked: post.value.userLiked,
      });
    }
  } catch (error) {
    console.error(
      "按讚提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
    // 失敗時回滾到之前狀態
    post.value.likes = previousLikes;
    post.value.userLiked = previousUserLiked;
  } finally {
    isLikeProcessing.value = false;
  }
};

//  因為不用 Modal Reply 且部分功能雷同，直接寫入此檔案

// 回覆＿檢查是否啟用提交按鈕
const isSubmitDisabled = computed(() => !(content.value.trim() || file.value));

// 回覆＿獲取 <input type="file">
const triggerFileInput = () => {
  if (!authStore.userId || !authStore.accessToken) {
    emitter.emit("openLoginModal");
  } else {
    fileInputRef.value?.click();
  }
};

// 回覆＿處理檔案上傳與預覽
const handleFileUpload = (event) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  file.value = selectedFile;

  try {
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileUrl.value = e.target.result;
      };
      reader.onerror = () => {
        message.error("圖片讀取失敗！");
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type.startsWith("video/")) {
      fileUrl.value = URL.createObjectURL(selectedFile);
    } else {
      file.value = null;
      message.error("僅支援圖片和影片檔案！");
    }
  } catch (error) {
    file.value = null;
    fileUrl.value = null;
    message.error("檔案處理失敗，請重試！");
  }
};

// 回覆＿取消預覽
const cancelFilePreview = () => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  fileUrl.value = null;
  file.value = null;
  if (fileInputRef.value) fileInputRef.value.value = null;
};

// 回覆＿獨立處理圖片上傳
const uploadFile = async () => {
  if (!file.value) return null;
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

// 回覆＿提交上傳資料庫
const handleMessage = async (postId) => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  loadingBar.start();
  try {
    const uploadedFileUrl = await uploadFile();
    const response = await apiClient.post(
      `/replies/${postId}/${authStore.userId}`,
      {
        content: content.value,
        fileUrl: uploadedFileUrl,
      }
    );
    if (response.status === 201) {
      content.value = "";
      file.value = null;
      fileUrl.value = null;
      message.success("回覆成功！");
    } else {
      message.error("回覆失敗！");
      loadingBar.error();
    }
  } catch (error) {
    console.error("回覆錯誤:", error);
    message.error("回覆失敗！");
  } finally {
    loadingBar.finish();
  }
};

// 動態調整高度
const adjustTextareaHeight = () => {
  const textarea = textareaRef.value;
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight)}px`;
  }
};

onMounted(async () => {
  document.addEventListener("mousedown", closeModal);
  await fetchSingleComment(route.params.id);
  await nextTick();
  if (textareaRef.value) {
    adjustTextareaHeight();
    textareaRef.value.focus();
  }
});

onUnmounted(() => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  if (fileInputRef.value) fileInputRef.value.value = null;
  document.removeEventListener("mousedown", closeModal);
});

// 監聽內容，調整高度
watch(
  content,
  () => {
    adjustTextareaHeight();
  },
  { immediate: true }
);
</script>

<template>
  <NavbarUp />
  <div class="container-box" v-if="post">
    <div class="back-icon">
      <router-link to="#" @click.prevent="$router.back()">
        <img class="icon" :src="Backicon" alt="Backicon" />
      </router-link>
    </div>
    <div class="container">
      <div class="comment-box">
        <div class="photo-content">
          <router-link :to="`/@${post.name}`">
            <img
              :src="post.user_avatar || 'https://via.placeholder.com/50'"
              alt="頭像"
              class="photo"
            />
          </router-link>
        </div>

        <div class="comment">
          <div class="info">
            <div class="info-span">
              <router-link class="comment-author" :to="`/@${post.name}`">
                {{ post.name }}
              </router-link>
              <span class="comment-time">
                {{ dateStore.formatDate(post.timestamp) }}
              </span>
            </div>

            <div class="info-modal">
              <button @click="openModal" class="info-link">
                <img class="icon" :src="Moreicon" alt="More icon" />
              </button>
              <div v-show="isModalOpen" class="modal-overlay">
                <div class="modal-content" @click.stop>
                  <ul>
                    <li
                      v-if="
                        authStore.isLoggedIn &&
                        authStore.accountName === post.name
                      "
                    >
                      <button class="modal-link" @click="handleUpdate(post.id)">
                        <img class="icon" :src="Editicon" alt="Edit icon" />
                        <span>編輯</span>
                      </button>
                    </li>
                    <li
                      v-if="
                        authStore.isLoggedIn &&
                        authStore.accountName === post.name
                      "
                    >
                      <button
                        class="modal-link"
                        @click="handleDeleteConfirm(post.id)"
                      >
                        <img class="icon" :src="Deleteicon" alt="Delete icon" />
                        <span>刪除</span>
                      </button>
                    </li>
                    <li v-if="authStore.accountName !== post.name">
                      <button class="modal-link">
                        <img class="icon" :src="Flagicon" alt="Flag icon" />
                        <span>檢舉</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="comment-content">
            <p>{{ post.content }}</p>
            <span v-if="post.file_url">
              <n-image
                v-if="isImage(post.file_url)"
                :src="post.file_url"
                alt="post media"
                lazy
                :preview-disabled="false"
                class="comment-image"
              >
                <template #placeholder>
                  <div class="media-placeholder">Loading Image...</div>
                </template>
              </n-image>
              <div v-else-if="isVideo(post.file_url)" class="video-wrapper">
                <video
                  :src="post.file_url"
                  controls
                  class="comment-video"
                  preload="auto"
                  @error="
                    (e) => {
                      console.error('Video load error:', post.file_url, e);
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
                <div
                  class="reply-count"
                  @click="checkTokenAndOpenModal(post.id)"
                >
                  <button class="reply-link">
                    <img
                      :class="{ icon: !post.userLiked }"
                      :src="post.userLiked ? FavoriteRedicon : Favoriteicon"
                      alt="Like"
                    />
                  </button>
                  <n-badge :value="post.likes || 0" />
                </div>
              </li>
            </ul>
            <div class="user-content">
              <div class="file-upload-container">
                <div class="file-upload-select">
                  <input
                    type="file"
                    ref="fileInputRef"
                    @change="handleFileUpload"
                    class="file-input"
                    style="display: none"
                  />
                  <button
                    type="button"
                    @click="triggerFileInput"
                    class="submit-button"
                  >
                    <img class="icon" :src="Noteicon" alt="Note icon" />
                  </button>
                </div>
              </div>

              <div class="textarea-wrapper">
                <label for="content"></label>
                <textarea
                  id="content"
                  ref="textareaRef"
                  :readonly="!authStore.userId || !authStore.accessToken"
                  v-model="content"
                  placeholder="想回覆點什麼呢？"
                ></textarea>
              </div>
              <div class="message-form-end">
                <n-button
                  :disabled="isSubmitDisabled"
                  @click="handleMessage(post.id)"
                >
                  發佈
                </n-button>
              </div>
            </div>
          </div>

          <div v-if="fileUrl" class="file-preview-container">
            <div class="file-preview">
              <img
                v-if="isPreviewImage"
                :src="fileUrl"
                alt="File Preview"
                class="preview-img"
              />
              <video
                v-else-if="isPreviewVideo"
                :src="fileUrl"
                controls
                class="preview-video"
                preload="auto"
              />
              <button @click="cancelFilePreview" class="cancel-preview-button">
                <img :src="Closeicon" alt="Close icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <SingleReplies />
    </div>
  </div>
  <div v-else>正在加載貼文...</div>
  <Navbar />
</template>

<style scoped>
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin: 100px 0;
  margin-top: calc(100px - 44px);
}

.comment-box {
  padding: 20px 25px 15px 25px;
  display: flex;
}

.back-icon {
  margin: 15px 0 15px 5px;
  display: flex;
}

.back-icon a {
  display: flex;
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

.reply-section {
  display: flex;
  margin-left: -10px;
  align-items: flex-start;
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

.dark-mode .modal-overlay .modal-content {
  background: rgb(24, 24, 24);
}

.light-mode .modal-overlay .modal-content {
  background: rgb(255, 255, 255);
}

.modal-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-modal .modal-link {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
}

.modal-link img {
  margin-right: 8px;
}

.comment-content {
  margin-bottom: 10px;
}

.comment-content p {
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

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

.user-content {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
}

.textarea-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-content textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding: 0 20px;
  margin: 8px 0 10px;
  color: rgb(243, 245, 247);
  line-height: 1.5;
  overflow-y: auto;
  min-height: 60px !important;
}

.user-content textarea::placeholder {
  color: #aaa;
  opacity: 0.7;
}

.user-content .file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-content .file-input {
  display: none;
}

.user-content .submit-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.file-preview-container {
  display: flex;
}

.file-preview {
  margin-top: 10px;
  text-align: center;
  position: relative;
}

.preview-img,
.preview-video {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
}

.cancel-preview-button {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--n-text-color) !important;
  background-color: var(--n-body-color) !important;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.message-form-end button {
  margin-top: 5px;
  padding: 10px 20px;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
  border-radius: 10px;
}

.n-button {
  --n-text-color-hover: #000 !important;
  --n-border-hover: 1px solid #000 !important;
}

.dark-mode .n-button {
  --n-text-color-hover: #fff !important;
  --n-border-hover: 1px solid #fff !important;
}

.light-mode .user-content textarea {
  color: rgb(0, 0, 0);
}
</style>
