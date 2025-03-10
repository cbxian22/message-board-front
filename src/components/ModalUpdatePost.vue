<template>
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
          <n-button :disabled="isSubmitDisabled" @click="handleMessage"
            >發佈</n-button
          >
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted } from "vue";
import { NButton, useLoadingBar, useMessage, useDialog } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../stores/axiosConfig";
import Modal from "./Modal.vue";
import { emitter } from "../main";

import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();
const loadingBar = useLoadingBar();

const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: Boolean,
  postId: {
    type: [String, Number],
    required: true, // postId 是必須的
  },
});

const userName = computed(() => authStore.userName || "未知用户");
const content = ref("");
const textarea = ref(null);
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);
const postData = ref(null); // 儲存從 API 獲取的貼文資料
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

// 檢查是否啟用提交按鈕
const isSubmitDisabled = computed(() => {
  if (!postData.value) {
    return !(content.value.trim() || file.value);
  }
  const isContentUnchanged = content.value === (postData.value.content || "");
  const isFileUrlUnchanged =
    fileUrl.value === (postData.value.file_url || null);
  const noNewFile = !file.value;
  return isContentUnchanged && isFileUrlUnchanged && noNewFile;
});

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
      postData.value = {
        id: comment.id,
        content: comment.content,
        file_url: comment.file_url,
      };
      content.value = comment.content || "";
      fileUrl.value = comment.file_url || null;
      file.value = null;
    } else {
      message.error("無法獲取單一貼文，數據格式不正確");
    }
  } catch (error) {
    console.error("取得單一貼文錯誤:", error);
    message.error("單一貼文取得失敗，請檢查網絡或稍後再試！");
  }
};

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

// 提交更新貼文
const handleMessage = async () => {
  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    return;
  }

  if (!props.postId) {
    message.error("無效的貼文 ID！");
    return;
  }

  loadingBar.start();

  try {
    const uploadedFileUrl = await uploadFile();
    const response = await apiClient.put(
      `/posts/${props.postId}/${authStore.userId}`,
      {
        content: content.value,
        fileUrl: uploadedFileUrl,
        visibility: visibility.value,
      }
    );

    if (response.status === 200) {
      const updatedPost = {
        id: props.postId,
        content: content.value,
        file_url: uploadedFileUrl,
      };
      emitter.emit("updatePost", updatedPost); // 通知父組件
      message.success("貼文更新成功！");
      content.value = "";
      file.value = null;
      fileUrl.value = null;
      emit("update:modelValue", false); // 關閉模態
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

// 判斷是否有變更
const hasChanges = computed(() => {
  if (!postData.value) {
    return content.value.trim() || file.value;
  }
  const isContentChanged = content.value !== (postData.value.content || "");
  const isFileUrlChanged = fileUrl.value !== (postData.value.file_url || null);
  const isFileAdded = !!file.value;
  return isContentChanged || isFileUrlChanged || isFileAdded;
});

// 處理 Modal 關閉邏輯
const handleModalClose = (newValue) => {
  if (!hasChanges.value) {
    emit("update:modelValue", false);
  } else {
    dialog.warning({
      content: "確認要關閉並取消更新內容嗎？",
      positiveText: "關閉",
      negativeText: "取消",
      onPositiveClick: () => {
        content.value = "";
        file.value = null;
        fileUrl.value = null;
        emit("update:modelValue", false);
      },
      onNegativeClick: () => {
        emit("update:modelValue", false);
      },
    });
  }
};

// 監聽內容變化並調整高度
watch(content, () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = "auto";
      textarea.value.style.height = `${textarea.value.scrollHeight}px`;
    }
  });
});

// 在組件掛載時獲取貼文資料
onMounted(() => {
  if (props.postId) {
    fetchSingleComment(props.postId);
  }
});

// 監聽 postId 變化
watch(
  () => props.postId,
  (newPostId) => {
    if (newPostId) {
      fetchSingleComment(newPostId);
    }
  }
);
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
