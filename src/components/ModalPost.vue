<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal :modelValue="modelValue" @update:modelValue="handleModalClose">
    <div class="message-container">
      <form @submit.prevent="handleMessage" class="message-form">
        <div class="message-form-up">
          <p>新貼文</p>
        </div>

        <div class="message-form-mi">
          <div>
            <img
              :src="authStore.userAvatar"
              alt="頭像"
              class="photo"
              draggable="false"
            />
          </div>

          <div class="user-content">
            <p>{{ userName }}</p>
            <label for="content"></label>
            <textarea
              id="content"
              v-model="content"
              placeholder="最近想潑點什麼呢？"
              ref="textarea"
            ></textarea>

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
                  <img :src="Noteicon" alt="Noteicon" />
                </button>
              </div>

              <!-- 圖片預覽區域 -->
              <div v-if="fileUrl">
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
                  <button
                    @click="cancelFilePreview"
                    class="cancel-preview-button"
                  >
                    <img :src="Closeicon" alt="Close icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="message-form-end">
          <div class="toWho">
            <n-dropdown
              trigger="click"
              width="125"
              placement="bottom-start"
              :options="visibilityOptions"
              @select="handleVisibilitySelect"
            >
              <span>向誰發佈</span>
            </n-dropdown>
          </div>
          <div>
            <n-button :disabled="isSubmitDisabled" @click="handleMessage"
              >發佈</n-button
            >
          </div>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, nextTick, watch, computed, onUnmounted } from "vue";
import {
  NButton,
  useLoadingBar,
  useMessage,
  useDialog,
  NDropdown,
} from "naive-ui";
import { useSocketStore } from "../stores/socketStore";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../stores/axiosConfig"; // 引入 apiClient
import Modal from "./Modal.vue";

import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();
const socketStore = useSocketStore();
const loadingBar = useLoadingBar();

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

// const prevHeight = ref("auto"); // 儲存上一次高度
const userName = computed(() => authStore.userName || "未知用户");
const content = ref("");
const textarea = ref(null); // 取得 textarea DOM 節點
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);
const visibility = ref(null);

// 下拉選單選項
const visibilityOptions = [
  { label: "公開", key: "public" },
  { label: "朋友", key: "friends" },
  { label: "私人", key: "private" },
];

// 處理可見性選擇
const handleVisibilitySelect = (key) => {
  visibility.value = key;
  message.info(
    `已選擇發佈給：${visibilityOptions.find((opt) => opt.key === key).label}`
  );
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

const isPreviewImage = computed(() => getFileType(file.value) === "image");
const isPreviewVideo = computed(() => getFileType(file.value) === "video");

// 貼文＿檢查是否啟用提交按鈕
const isSubmitDisabled = computed(() => !(content.value.trim() || file.value));

// 貼文＿獲取 <input type="file">
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 貼文＿檢查檔案上傳處理，並顯示預覽
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

// 貼文＿取消檔案預覽，重設檔案選擇
const cancelFilePreview = () => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  fileUrl.value = null;
  file.value = null;
  if (fileInputRef.value) fileInputRef.value.value = null;
};

// 貼文＿獨立處理圖片上傳
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

// 貼文＿提交上傳資料庫
const handleMessage = async () => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }

  loadingBar.start();

  try {
    const uploadedFileUrl = await uploadFile();
    const response = await apiClient.post(`/posts/${authStore.userId}`, {
      content: content.value,
      fileUrl: uploadedFileUrl,
      visibility: visibility.value,
    });

    if (response.status === 201) {
      content.value = "";
      file.value = null;
      fileUrl.value = null;
      emit("update:modelValue", false);
      message.success("貼文成功！");
    } else {
      message.error("貼文失敗！");
      loadingBar.error();
    }
  } catch (error) {
    console.error("貼文錯誤:", error);
    message.error("貼文失敗！");
  } finally {
    loadingBar.finish();
  }
};

// 處理 Modal
const handleModalClose = (newValue) => {
  if (content.value.trim() || file.value) {
    dialog.warning({
      content: "確認要關閉並清除內容嗎？",
      positiveText: "關閉",
      negativeText: "取消",
      onPositiveClick: () => {
        content.value = "";
        file.value = null;
        fileUrl.value = null;
        emit("update:modelValue", false);
      },
    });
  } else {
    emit("update:modelValue", false);
  }
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

onUnmounted(() => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  if (fileInputRef.value) fileInputRef.value.value = null;
});
</script>

<style scoped>
.message-container {
  display: flex;
  flex-direction: column;
  width: 625px;
  height: auto;
  border-radius: 20px;
  background-color: rgb(16, 16, 16);
  text-align: center;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
}
.message-container * {
  background: transparent;
}

.message-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-form-up {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.5px solid rgba(102, 102, 102, 0.5);
  max-height: 52px;
  min-height: 52px;
}

.message-form-mi {
  flex: 2;
  display: flex;
  align-items: flex-start;
  padding-top: 20px;
  margin-left: 30px;
  min-height: 104px;
  max-height: 250px;
  overflow: auto;
}

.photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  display: flex;
}

.user-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.user-content p {
  margin-bottom: 5px;
  font-weight: bold;
}

.user-content textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding-right: 30px;
  color: rgb(243, 245, 247);
  min-height: 70px !important;
}

.user-content textarea::placeholder {
  color: #aaa;
  opacity: 0.7;
}

/* ai */
.user-content .file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-content .file-input {
  display: none; /* 隱藏預設的文件選擇按鈕 */
}

.user-content .submit-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
}

/* 預覽 */
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

/* up ai */
.message-form-end {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 30px;
  max-height: 52px;
  min-height: 52px;
}

.message-form-end .toWho {
  color: #aaa;
  opacity: 0.7;
  cursor: pointer;
}

.message-form-end button {
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

.light-mode .message-container {
  background: rgb(255, 255, 255);
}
.light-mode .user-content textarea {
  color: rgb(0, 0, 0);
}
</style>
