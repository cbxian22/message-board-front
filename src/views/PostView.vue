<script setup>
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

const userName = computed(() => authStore.userName || "未知用户");

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
    <!-- <div class="back-icon" :class="{ hidden: isFromNavbar() }"> -->
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

/* 淺色下更改引入 icon 顏色 */
.light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
}
</style>
