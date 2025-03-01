<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal :modelValue="modelValue" @update:modelValue="handleModalClose">
    <div class="message-container">
      <form @submit.prevent="handleMessage" class="message-form">
        <div class="message-form-up">
          <p>更新貼文</p>
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
              <div v-if="fileUrl" class="file-preview">
                <img :src="fileUrl" alt="File Preview" class="preview-img" />
                <button
                  @click="cancelFilePreview"
                  class="cancel-preview-button"
                >
                  <img :src="Closeicon" alt="Closeicon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="message-form-end">
          <n-button :disabled="isSubmitDisabled" @click="handleMessage"
            >發佈</n-button
          >
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, nextTick, watch, computed } from "vue";
import { NButton, useLoadingBar, useMessage, useDialog } from "naive-ui";
import { useSocketStore } from "../stores/socketStore";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../stores/axiosConfig"; // 引入 apiClient
import Modal from "./Modal.vue";
import { emitter } from "../main";

import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();
const socketStore = useSocketStore();
const loadingBar = useLoadingBar();

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: Boolean,
  comment: Object,
});

const userName = computed(() => authStore.userName || "未知用户");
const content = ref("");
const textarea = ref(null); // 取得 textarea DOM 節點
const prevHeight = ref("auto"); // 儲存上一次高度
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);

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
    message.error("請先登入！");
    return;
  }

  loadingBar.start();

  try {
    const uploadedFileUrl = await uploadFile();
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
      message.success("貼文更新成功！");
      emit("update:modelValue", false);
      emitter.emit("updatePost");
    } else {
      message.error("貼文更新失敗！");
      loadingBar.error();
    }
  } catch (error) {
    console.error("貼文更新錯誤:", error);
    message.error("貼文更新失敗！");
  } finally {
    loadingBar.finish();
  }
};

// 處理 Modal 關閉的邏輯
// const handleModalClose = (newValue) => {
//   if (content.value.trim() || file.value) {
//     if (!window.confirm("確認要關閉並清除內容嗎？")) return;
//   }
//   content.value = "";
//   file.value = null;
//   fileUrl.value = null;
//   emit("update:modelValue", false);
// };
// 判斷是否有變更
const hasChanges = computed(() => {
  if (!props.comment) {
    // 如果沒有初始貼文（新建模式），只要有內容或檔案就算有變更
    return content.value.trim() || file.value;
  }
  // 編輯模式：比較當前值與初始值
  const isContentChanged = content.value !== (props.comment.content || "");
  const isFileUrlChanged = fileUrl.value !== (props.comment.file_url || null);
  const isFileAdded = !!file.value; // 是否有新上傳的檔案
  return isContentChanged || isFileUrlChanged || isFileAdded;
});

// 處理 Modal 關閉邏輯
const handleModalClose = (newValue) => {
  if (!hasChanges.value) {
    // 無變更，直接關閉
    emit("update:modelValue", false);
  } else {
    // 有變更，顯示確認對話框
    dialog.warning({
      content: "確認要關閉並取消更新內容嗎？",
      positiveText: "關閉",
      negativeText: "取消",
      onPositiveClick: () => {
        // 點"關閉"：清除內容並關閉 Modal
        content.value = "";
        file.value = null;
        fileUrl.value = null;
        emit("update:modelValue", false);
      },
      onNegativeClick: () => {
        // 點"取消"：保留內容但關閉 Modal
        emit("update:modelValue", false);
      },
    });
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
.file-preview {
  margin-top: 10px;
  text-align: center;
}

.preview-img {
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
}

/* up ai */
.message-form-end {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: end;
  margin: 20px 30px;
  max-height: 52px;
  min-height: 52px;
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
