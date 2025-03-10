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
const isOpenModal = ref(false);
const selectedPostId = ref(null);
const isLoginModalOpen = ref(false);

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
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  if (isLikeProcessing.value) {
    console.log("點讚操作正在進行中，忽略此次請求");
    return;
  }
  isLikeProcessing.value = true;
  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "post",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      emit("likePost", {
        id,
        likes: response.data.likesCount,
        userLiked: !post.value.userLiked,
      });
      post.value.likes = response.data.likesCount;
      post.value.userLiked = !post.value.userLiked;
    }
  } catch (error) {
    console.error(
      "按讚提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
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

// 回覆＿檢查檔案上傳處理，並顯示預覽
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

// 回覆＿取消檔案預覽，重設檔案選擇
const cancelFilePreview = () => {
  fileUrl.value = null;
  file.value = null;
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
        // parentId: post.value.id,
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

const textareaType = () => {
  if (!authStore.userId || !authStore.accessToken) {
    emitter.emit("openLoginModal");
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
  document.removeEventListener("mousedown", closeModal);
});

// 監聽內容，調整高度
watch(content, () => {
  adjustTextareaHeight();
});
</script>

<template>
  <NavbarUp />
  <div class="container-box container" v-if="post">
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
              <div class="reply-count" @click="checkTokenAndOpenModal(post.id)">
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
                  <img :src="Noteicon" alt="Note icon" />
                </button>
              </div>
            </div>

            <div class="textarea-wrapper">
              <label for="content"></label>
              <textarea
                id="content"
                ref="textareaRef"
                @input="textareaType"
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

        <div v-if="fileUrl" class="file-preview-wrapper">
          <div class="file-preview">
            <img :src="fileUrl" alt="File Preview" class="preview-img" />
            <button @click="cancelFilePreview" class="cancel-preview-button">
              <img :src="Closeicon" alt="Close icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <SingleReplies :post-id="postId" />
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
}

.comment-box {
  padding: 20px 25px 15px 25px;
  border-bottom: 0.5px solid #373737;
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
  max-height: 100px;
  overflow-y: auto;
}

.fixed-textarea::placeholder {
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

.file-preview-wrapper {
  margin-left: 10px;
}

.file-preview {
  margin-top: 10px;
  text-align: flex-start;
  position: relative;
}

.preview-img {
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
  border: none;
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

.light-mode .fixed-textarea {
  background-color: #f5f5f5;
  color: #000;
  border: 1px solid #ccc;
}
</style>
