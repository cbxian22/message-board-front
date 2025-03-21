<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { NBadge, useMessage, NImage, useLoadingBar, useDialog } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import { useRoute } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";

import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const route = useRoute();
const authStore = useAuthStore();
const dateStore = useDateStore();
const message = useMessage();
const loadingBar = useLoadingBar();
const dialog = useDialog();

const replies = ref([]);
const content = ref("");
const textareas = ref({});
const fileInputRefs = ref({});
const editingReplyId = ref(null);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isEditing = ref(false);
const isLikeProcessing = ref(false);
const postId = route.params.id;
const replyStates = ref({});

const initReplyState = (replyId) => {
  if (!replyStates.value[replyId]) {
    replyStates.value[replyId] = {
      file: null,
      fileUrl: null,
    };
  }
};

// 是否有未儲存的變更
const hasUnsavedChanges = computed(() => {
  const reply = replies.value.find((r) => r.id === editingReplyId.value);
  if (!reply || !isEditing.value) return false;
  const state = replyStates.value[editingReplyId.value] || {};
  return (
    content.value !== reply.content ||
    (state.fileUrl !== reply.file_url && state.fileUrl !== null) ||
    state.file !== null
  );
});

// 檢查檔案類型
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

const isImage = (url) => getFileType(url) === "image";
const isVideo = (url) => getFileType(url) === "video";

const isPreviewImage = computed(() => {
  const state = replyStates.value[editingReplyId.value] || {};
  return getFileType(state.file || state.fileUrl) === "image";
});
const isPreviewVideo = computed(() => {
  const state = replyStates.value[editingReplyId.value] || {};
  return getFileType(state.file || state.fileUrl) === "video";
});

const openModal = (event, replyId) => {
  event.stopPropagation();
  if (modalState.value[replyId]) {
    modalState.value[replyId] = false;
    return;
  }
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
  modalState.value[replyId] = true;
};

// 回覆＿關閉 Modal
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

// 獲取回覆
const fetchReplies = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const token = authStore.accessToken;
    const response = await apiClient.get(`/replies/${postId}`, {
      params: { userId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    console.log("fetchReplies 後端返回的資料:", response.data); // 調試用
    if (response.status === 200 && Array.isArray(response.data)) {
      replies.value = response.data.map((reply) => {
        console.log("單個 reply 的 file_url:", reply.file_url); // 調試用
        return {
          id: reply.id,
          content: reply.content,
          timestamp: new Date(reply.created_at),
          file_url: reply.file_url, // 確保映射正確
          name: reply.user_name,
          user_avatar: reply.user_avatar,
          likes: reply.likes || 0,
          userLiked: reply.user_liked || false,
          replies: reply.replies || 0,
        };
      });
      console.log("更新後的 replies:", replies.value); // 調試用
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

// 編輯回覆
const handleUpdate = async (replyId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }

  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });

  if (
    isEditing.value &&
    editingReplyId.value !== replyId &&
    hasUnsavedChanges.value
  ) {
    const shouldProceed = await new Promise((resolve) => {
      dialog.warning({
        content: "您有未儲存的變更，確定要編輯其他回覆嗎？",
        positiveText: "確定",
        negativeText: "取消",
        onPositiveClick: () => {
          cancelEdit();
          resolve(true);
        },
        onNegativeClick: () => resolve(false),
      });
    });

    if (!shouldProceed) return;
  }

  const reply = replies.value.find((r) => r.id === replyId);
  if (reply) {
    isEditing.value = true;
    editingReplyId.value = replyId;
    content.value = reply.content;
    initReplyState(replyId);
    replyStates.value[replyId].fileUrl = reply.file_url; // 初始化現有檔案
    replyStates.value[replyId].file = null;
    nextTick(() => {
      adjustTextareaHeight(replyId);
      const textarea = textareas.value[replyId];
      if (textarea) textarea.focus();
    });
  }
};

// 取消編輯
const cancelEdit = () => {
  isEditing.value = false;
  const replyId = editingReplyId.value;
  if (replyId && replyStates.value[replyId]) {
    const state = replyStates.value[replyId];
    const reply = replies.value.find((r) => r.id === replyId);
    if (state.fileUrl && (!reply || reply.file_url !== state.fileUrl)) {
      URL.revokeObjectURL(state.fileUrl);
    }
    replyStates.value[replyId] = {
      file: null,
      fileUrl: reply?.file_url || null,
    };
  }
  editingReplyId.value = null;
  content.value = "";
};

// 觸發檔案輸入
const triggerFileInput = (replyId) => {
  if (editingReplyId.value === replyId) {
    fileInputRefs.value[replyId]?.click();
  }
};

// 處理檔案上傳
const handleFileUpload = (event, replyId) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) {
    console.log("未選擇檔案");
    return;
  }

  console.log("選擇的檔案:", selectedFile.name, selectedFile.type);

  initReplyState(replyId);
  const state = replyStates.value[replyId];

  if (
    state.fileUrl &&
    !replies.value.some((r) => r.file_url === state.fileUrl)
  ) {
    URL.revokeObjectURL(state.fileUrl);
    console.log("已清理舊的 fileUrl:", state.fileUrl);
  }

  state.file = selectedFile;
  try {
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        state.fileUrl = e.target.result;
        console.log("圖片預覽已生成:", state.fileUrl);
        nextTick(() => adjustTextareaHeight(replyId));
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type.startsWith("video/")) {
      state.fileUrl = URL.createObjectURL(selectedFile);
      console.log("影片預覽已生成:", state.fileUrl);
      nextTick(() => adjustTextareaHeight(replyId));
    } else {
      state.file = null;
      message.error("僅支援圖片和影片檔案！");
    }
  } catch (error) {
    state.file = null;
    state.fileUrl = null;
    message.error("檔案處理失敗，請重試！");
    console.error("檔案處理錯誤:", error);
  }
};

// 取消檔案預覽
const cancelFilePreview = (replyId) => {
  const state = replyStates.value[replyId];
  if (
    state &&
    state.fileUrl &&
    !replies.value.some((r) => r.file_url === state.fileUrl)
  ) {
    URL.revokeObjectURL(state.fileUrl);
  }
  state.fileUrl = null;
  state.file = null;
  if (fileInputRefs.value[replyId]) {
    fileInputRefs.value[replyId].value = null;
  }
};

// 上傳檔案
const uploadFile = async (replyId) => {
  const state = replyStates.value[replyId] || {};
  if (!state.file) return state.fileUrl || null; // 如果沒有新檔案，返回現有 URL

  try {
    console.log("開始上傳檔案:", state.file.name); // 調試用
    const { data } = await apiClient.get("/upload", {
      params: { filename: state.file.name, contentType: state.file.type },
    });
    console.log("獲取上傳 URL:", data.uploadUrl); // 調試用

    await apiClient.put(data.uploadUrl, state.file, {
      headers: { "Content-Type": state.file.type },
    });
    console.log("檔案上傳成功，返回 URL:", data.fileUrl); // 調試用
    return data.fileUrl;
  } catch (error) {
    console.error("檔案上傳失敗:", error.response?.data || error.message);
    return null;
  }
};

// 貼文＿刪除確認
const handleDeleteConfirm = (replayId) => {
  // 關閉所有 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
  dialog.warning({
    content: "刪除貼文後回覆也將一併刪除，且無法復原！",
    positiveText: "刪除",
    negativeText: "取消",
    onPositiveClick: () => {
      handleDelete(replayId);
    },
  });
};

// 回覆＿刪除
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
    await fetchReplies(postId);
  } catch (error) {
    console.error("刪除失敗:", error.message);
    message.error("刪除失敗");
  }
};

// 登入確認＿like
const checkTokenAndOpenModal = (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    emitter.emit("openLoginModal");
  } else {
    handlelike(id);
  }
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

// 提交更新
const handleMessage = async () => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }

  loadingBar.start();
  try {
    const replyId = editingReplyId.value;
    if (!replyId) {
      message.error("無效的回覆 ID");
      return;
    }

    const state = replyStates.value[replyId] || {};
    const uploadedFileUrl = await uploadFile(replyId);
    console.log("上傳的 fileUrl:", uploadedFileUrl);

    if (state.file && !uploadedFileUrl) {
      message.error("檔案上傳失敗，請重試！");
      return;
    }

    const fileUrlToSend = uploadedFileUrl || state.fileUrl;
    const response = await apiClient.put(
      `/replies/${replyId}/${authStore.userId}`,
      {
        content: content.value,
        fileUrl: fileUrlToSend, // 改為 fileUrl，匹配後端
      }
    );

    console.log("後端回應:", response.data);

    if (response.status === 200) {
      const index = replies.value.findIndex((r) => r.id === replyId);
      if (index !== -1) {
        replies.value[index] = {
          ...replies.value[index],
          content: content.value,
          file_url: fileUrlToSend, // 前端仍使用 file_url 作為內部字段
        };
        console.log("更新後的前端 replies:", replies.value[index]);
      }
      message.success("回覆更新成功！");
      cancelEdit();
      await fetchReplies(postId); // 立即同步後端資料
    }
  } catch (error) {
    console.error("更新失敗:", error.response?.data || error.message);
    message.error("更新失敗，請檢查網絡或檔案格式！");
  } finally {
    loadingBar.finish();
  }
};

// 檢查提交按鈕是否啟用
const isSubmitDisabled = computed(() => {
  const reply = replies.value.find((r) => r.id === editingReplyId.value);
  if (!reply) return !content.value.trim();
  const state = replyStates.value[editingReplyId.value] || {};
  return (
    content.value === reply.content &&
    state.fileUrl === reply.file_url &&
    !state.file
  );
});

// 調整 textarea 高度
const adjustTextareaHeight = (replyId) => {
  nextTick(() => {
    const textarea = textareas.value[replyId];
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  });
};

watch(content, () => {
  if (isEditing.value && editingReplyId.value) {
    adjustTextareaHeight(editingReplyId.value);
  }
});

onMounted(async () => {
  document.addEventListener("mousedown", closeModal);
  await fetchReplies(postId);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
  Object.keys(replyStates.value).forEach((replyId) => {
    const state = replyStates.value[replyId];
    if (
      state.fileUrl &&
      !replies.value.some((r) => r.file_url === state.fileUrl)
    ) {
      URL.revokeObjectURL(state.fileUrl);
    }
  });
});
</script>

<template>
  <div v-if="replies.length > 0">
    <div
      v-for="(reply, index) in replies"
      :key="reply.id"
      :class="['reply-box', { 'is-last': index === replies.length - 1 }]"
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
              :ref="(el) => (buttonRefs[reply.id] = el)"
              @click="openModal($event, reply.id)"
              class="info-link"
            >
              <img class="icon" :src="Moreicon" alt="Moreicon" />
            </button>
            <div
              v-show="modalState[reply.id]"
              class="modal-overlay"
              :ref="(el) => (modalRefs[reply.id] = el)"
            >
              <div class="modal-content" @click.stop>
                <ul>
                  <li
                    v-if="
                      authStore.isLoggedIn &&
                      authStore.accountName === reply.name &&
                      !(isEditing && editingReplyId === reply.id)
                    "
                  >
                    <button class="modal-link" @click="handleUpdate(reply.id)">
                      <img class="icon" :src="Editicon" alt="Editicon" />
                      <span>編輯</span>
                    </button>
                  </li>
                  <li
                    v-if="
                      authStore.isLoggedIn &&
                      authStore.accountName === reply.name
                    "
                  >
                    <button
                      class="modal-link"
                      @click="handleDeleteConfirm(reply.id)"
                    >
                      <img class="icon" :src="Deleteicon" alt="Deleteicon" />
                      <span>刪除</span>
                    </button>
                  </li>
                  <li v-if="authStore.accountName !== reply.name">
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
          <!-- 正常顯示 -->
          <template v-if="!(isEditing && editingReplyId === reply.id)">
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
                />
              </div>
            </span>
          </template>

          <!-- 編輯模式 -->
          <template v-if="isEditing && editingReplyId === reply.id">
            <textarea
              :ref="(el) => (textareas[reply.id] = el)"
              v-model="content"
              placeholder="編輯您的回覆..."
              class="edit-textarea"
            ></textarea>
          </template>
        </div>

        <div class="reply-section">
          <ul>
            <li>
              <div
                class="reply-count"
                @click="checkTokenAndOpenModal(reply.id)"
              >
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
            <li v-if="isEditing && editingReplyId === reply.id">
              <input
                type="file"
                :ref="(el) => (fileInputRefs[reply.id] = el)"
                @change="(e) => handleFileUpload(e, reply.id)"
                style="display: none"
              />
              <button @click="triggerFileInput(reply.id)" class="add-file-btn">
                <img class="icon" :src="Noteicon" alt="新增檔案" />
              </button>
            </li>
            <li
              class="save-btn-li"
              v-if="isEditing && editingReplyId === reply.id"
            >
              <button
                @click="handleMessage"
                :disabled="isSubmitDisabled"
                class="save-btn"
              >
                儲存
              </button>
            </li>
            <li
              class="cancel-btn-li"
              v-if="isEditing && editingReplyId === reply.id"
            >
              <button @click="cancelEdit" class="cancel-btn">取消</button>
            </li>
          </ul>
        </div>

        <div
          v-if="
            isEditing &&
            editingReplyId === reply.id &&
            replyStates[reply.id]?.fileUrl
          "
          class="file-preview-container"
        >
          <div class="file-preview">
            <img
              v-if="isPreviewImage"
              :src="replyStates[reply.id].fileUrl"
              alt="File Preview"
              class="preview-img"
            />
            <video
              v-else-if="isPreviewVideo"
              :src="replyStates[reply.id].fileUrl"
              controls
              class="preview-video"
              preload="auto"
            />
            <button
              @click="cancelFilePreview(reply.id)"
              class="cancel-preview-button"
            >
              <img :src="Closeicon" alt="Close icon" />
            </button>
          </div>
        </div>

        <!--  -->
      </div>
    </div>
  </div>
</template>
<style scoped>
.reply-box {
  padding: 20px 25px 15px 25px;
  display: flex;
  border-top: 0.5px solid #373737;
}

.reply-box.is-last {
  border-bottom: none;
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

.save-btn-li,
.cancel-btn-li {
  display: flex;
}

.reply-count,
.add-file-btn,
.save-btn,
.cancel-btn {
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

.reply-video {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.edit-textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding-right: 30px;
  color: rgb(243, 245, 247);
  max-height: 100px;
  overflow-y: auto;
}

.edit-textarea::placeholder {
  color: #aaa;
  opacity: 0.7;
}

/* 光模式下的文字顏色 */
.light-mode .edit-textarea {
  color: rgb(0, 0, 0);
}

.file-preview-container {
  display: flex;
}

.preview-img,
.preview-video {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
}

/* 取消預覽 */
.file-preview {
  margin-top: 10px;
  text-align: center;
  position: relative;
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

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
