<script setup>
import {
  ref,
  computed,
  watch,
  defineEmits,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import { NBadge, useMessage, NImage, useLoadingBar } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useDateStore } from "../stores/dateStore";
import { useRoute } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";

// import UpdateReplyView from "./ModalUpdateReply.vue";

import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
import Noteicon from "../assets/Noteicon.svg";

const route = useRoute();
const emit = defineEmits();
const authStore = useAuthStore();
const dateStore = useDateStore();
const message = useMessage();
const loadingBar = useLoadingBar();

// const props = defineProps({
//   modelValue: Boolean,
//   postId: {
//     type: [String, Number],
//     required: true,
//   },
// });

const replies = ref([]);
const content = ref("");
const textareas = ref({});
const file = ref(null); // 上傳檔案
const fileUrl = ref(null); // 檔案預覽URL
const fileInputRef = ref(null); // 檔案輸入引用
const editingReplyId = ref(null); // 正在編輯的回覆ID
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isEditing = ref(false);
const isLikeProcessing = ref(false);

const selectedReplyId = ref(null);
const postId = route.params.id;

// 回覆＿打開 Modal
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

// 回覆＿檔案類型檢查
const isImage = (url) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

// 回覆＿檔案類型檢查
const isVideo = (url) => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
  return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

// 回覆＿獲取
const fetchReplies = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const token = authStore.accessToken;
    const response = await apiClient.get(`/replies/${postId}`, {
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

// 回覆＿修改

// 修改後的處理編輯函數
const handleUpdate = (replyId) => {
  if (!authStore.accessToken) {
    message.error("請先登入！");
    return;
  }
  const reply = replies.value.find((r) => r.id === replyId);
  if (reply) {
    isEditing.value = true;
    editingReplyId.value = replyId;
    content.value = reply.content;
    fileUrl.value = reply.file_url;
    nextTick(() => {
      const textarea = textareas.value[replyId];
      if (textarea) {
        adjustTextareaHeight(replyId);
      } else {
        console.warn(`Textarea for reply ${replyId} not found after update.`);
      }
    });
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editingReplyId.value = null;
  content.value = "";
  file.value = null;
  fileUrl.value = null;
};

// 回覆＿按讚
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

//  因為不用 Modal Update Reply 且部分功能雷同，直接寫入此檔案

// 獲取 <input type="file">
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 處理檔案上傳並顯示預覽
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

// 取消檔案預覽
const cancelFilePreview = () => {
  fileUrl.value = null;
  file.value = null;
};

// 獨立處理圖片上傳
const uploadFile = async () => {
  if (!file.value) return fileUrl.value || null;
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

// 檢查是否有變更
const hasChanges = computed(() => {
  const reply = replies.value.find((r) => r.id === editingReplyId.value);
  if (!reply) return content.value.trim() || file.value;
  const isContentChanged = content.value !== reply.content;
  const isFileUrlChanged = fileUrl.value !== reply.file_url;
  const isFileAdded = !!file.value;
  return isContentChanged || isFileUrlChanged || isFileAdded;
});

// 回覆＿提交更新
const handleMessage = async () => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }

  if (!postId) {
    message.error("無效的貼文 ID！");
    return;
  }

  loadingBar.start();

  try {
    const uploadedFileUrl = await uploadFile();
    const response = await apiClient.put(
      `/replies/${editingReplyId.value}/${authStore.userId}`,
      {
        content: content.value,
        file_url: uploadedFileUrl,
      }
    );
    if (response.status === 200) {
      const index = replies.value.findIndex(
        (r) => r.id === editingReplyId.value
      );
      if (index !== -1) {
        replies.value[index] = {
          ...replies.value[index],
          content: content.value,
          file_url: uploadedFileUrl,
        };
      }
      message.success("回覆更新成功！");
      cancelEdit();
      await fetchReplies();
    }
  } catch (error) {
    console.error("貼文更新錯誤:", error);
    message.error("貼文更新失敗！");
  } finally {
    loadingBar.finish();
  }
};

// 檢查是否啟用提交按鈕

const isSubmitDisabled = computed(() => {
  const reply = replies.value.find((r) => r.id === editingReplyId.value);
  if (!reply) return !content.value.trim() && !file.value;
  return (
    content.value === reply.content &&
    fileUrl.value === reply.file_url &&
    !file.value
  );
});

// 調整 textarea 高度
// 調整 textarea 高度
const adjustTextareaHeight = (replyId) => {
  nextTick(() => {
    const textarea = textareas.value[replyId];
    if (!textarea) {
      console.warn(
        `Textarea element for reply ${replyId} is not available yet.`
      );
      return;
    }
    textarea.style.height = "auto"; // 重置高度以獲取真實 scrollHeight
    const contentHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(contentHeight, 100)}px`; // 設置最大高度為 100px
    console.log(
      "scrollHeight:",
      textarea.scrollHeight,
      "height:",
      textarea.style.height
    );
  });
};

// 監聽內容變化並調整高度
watch(content, () => {
  if (isEditing.value && editingReplyId.value) {
    adjustTextareaHeight(editingReplyId.value);
  }
});

onMounted(async () => {
  document.addEventListener("mousedown", closeModal);
  await fetchReplies(postId);
  if (isEditing.value && editingReplyId.value) {
    adjustTextareaHeight(editingReplyId.value);
  }
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});
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
        <!-- 沒有編輯時正常顯示 -->
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
                @error="
                  (e) => {
                    console.error('Video load error:', reply.file_url, e);
                    message.error('影片載入失敗，請檢查格式或網絡');
                  }
                "
              />
            </div>
          </span>
        </template>

        <!-- 編輯模式 -->
        <template v-else>
          <textarea
            :ref="(el) => (textareas[reply.id] = el)"
            v-model="content"
            placeholder="編輯您的回覆..."
            class="edit-textarea"
          ></textarea>

          <div v-if="fileUrl" class="file-preview">
            <n-image :src="fileUrl" alt="檔案預覽" class="preview-img" />
            <button @click="cancelFilePreview" class="cancel-preview-button">
              移除
            </button>
          </div>

          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileUpload"
            style="display: none"
          />
          <div class="edit-actions">
            <button @click="triggerFileInput" class="add-file-btn">
              <img :src="Noteicon" alt="新增檔案" />
            </button>
            <button
              @click="handleMessage"
              :disabled="isSubmitDisabled"
              class="save-btn"
            >
              儲存
            </button>
            <button @click="cancelEdit" class="cancel-btn">取消</button>
          </div>
        </template>
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
          <!-- 當 isEditing = true 出現-->
          <!-- <li v-if="isEditing">
            <div class="reply-count" @click="">
              <button class="reply-link">
                <img :src="Noteicon" alt="Noteicon" />
              </button>
              <n-badge :value="reply.likes || 0" />
            </div>
          </li> -->
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

.edit-textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding-right: 30px;
  color: rgb(243, 245, 247);
  max-height: 100px; /* 設置最大高度為 100px */
  overflow-y: auto; /* 超過 100px 時顯示滾動條 */
}

.edit-textarea::placeholder {
  color: #aaa;
  opacity: 0.7;
}

/* 光模式下的文字顏色 */
.light-mode .edit-textarea {
  color: rgb(0, 0, 0);
}

.file-preview {
  margin: 10px 0;
}

.preview-img {
  max-width: 200px;
  max-height: 200px;
}
.edit-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.add-file-btn,
.save-btn,
.cancel-btn {
  padding: 5px 15px;
  border-radius: 4px;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
