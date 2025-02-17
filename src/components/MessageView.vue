<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal :modelValue="modelValue" @update:modelValue="handleModalClose">
    <!-- @update:modelValue="emit('update:modelValue', $event)" -->
    <div class="message-container">
      <form @submit.prevent="handleMessage" class="message-form">
        <div class="message-form-up">
          <p>新貼文</p>
        </div>

        <div class="message-form-mi">
          <div>
            <!-- <img :src="userStore.userImageUrl" alt="UserPhoto" class="photo" /> -->
            <img
              :src="'https://fakeimg.pl/50/'"
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
              @input="adjustHeight"
              ref="textarea"
            ></textarea>

            <div class="file-upload-container">
              <div class="file-upload-select">
                <input
                  type="file"
                  @change="handleFileUpload"
                  class="file-input"
                  id="fileInput"
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
          <!-- <button type="submit" class="submit-btn">發佈</button> -->
          <n-button :disabled="isSubmitDisabled" @click="handleMessage"
            >發佈</n-button
          >
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";
import Modal from "./Modal.vue"; // 引入彈窗組件
import { ref, nextTick, watch, computed } from "vue";
import { NButton } from "naive-ui";
import axios from "../stores/axiosConfig"; // 統一配置後的 axios
import { useSocketStore } from "../stores/socketStore"; // WebSocket Store

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
const socketStore = useSocketStore();

// 取得使用者名稱
const userName = computed(() => localStorage.getItem("userName") || "未知用户");

const content = ref("");
const textarea = ref(null); // 取得 textarea DOM 節點
const prevHeight = ref("auto"); // 儲存上一次高度
const file = ref(null);
const fileUrl = ref(null);

// 檢查是否啟用提交按鈕
const isSubmitDisabled = computed(() => {
  return !content.value.trim() && !file.value;
});

const adjustHeight = () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = "auto"; // 先重設高度
      textarea.value.style.height = `${textarea.value.scrollHeight}px`; // 設定自動增長
      prevHeight.value = textarea.value.style.height; // 儲存當前高度
    }
  });
};

// 用來觸發檔案選擇框
const triggerFileInput = () => {
  const fileInput = document.getElementById("fileInput");
  fileInput.click(); // 觸發隱藏的檔案選擇框
};

// const handleFileUpload = (event) => {
//   file.value = event.target.files[0];
//   if (!file.value) return;
//   console.log("檔案已選擇:", file.value.name);
// };

// 檢查檔案上傳處理，並顯示預覽
const handleFileUpload = (event) => {
  const selectedFile = event.target.files[0]; // 取得使用者選擇的檔案

  if (selectedFile) {
    // 顯示檔案名稱
    console.log("檔案已選擇:", selectedFile.name);

    // 如果是圖片檔案，則顯示預覽
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileUrl.value = e.target.result; // 設置圖片預覽 URL
      };
      reader.readAsDataURL(selectedFile); // 將檔案轉為 Data URL
    }

    file.value = selectedFile; // 儲存檔案
  }
};

// 取消檔案預覽，重設檔案選擇
const cancelFilePreview = () => {
  fileUrl.value = null; // 清除圖片預覽 URL
  file.value = null; // 清除檔案
};

// const submitPost = async () => {
//   try {
//     let uploadedFileUrl = null;
//     if (file.value) {
//       console.log("開始上傳檔案...");
//       const { data } = await axios.get(
//         "https://message-board-server-7yot.onrender.com/api/upload",
//         {
//           params: { filename: file.value.name, contentType: file.value.type },
//         }
//       );

//       const { uploadUrl, fileUrl: tempFileUrl } = data;
//       await axios.put(uploadUrl, file.value, {
//         headers: { "Content-Type": file.value.type },
//       });
//       uploadedFileUrl = tempFileUrl;
//       console.log("檔案上傳成功:", uploadedFileUrl);
//     }
//     return uploadedFileUrl;
//   } catch (error) {
//     console.error("檔案上傳失敗:", error);
//     return null;
//   }
// };

// const handleMessage = async () => {
//   const userId = localStorage.getItem("userId");
//   const token = localStorage.getItem("token");

//   if (!userId || !token) {
//     alert("請先登入！");
//     return;
//   }

//   try {
//     const response = await axios.post(
//       `https://message-board-server-7yot.onrender.com/api/posts/${userId}`,
//       // { title: messagetitle.value, content: content.value },
//       { content: content.value },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     if (response.status === 201) {
//       // 發送 WebSocket 訊息
//       socketStore.sendMessage({
//         // title: messagetitle.value,
//         content: content.value,
//       });

//       // 清空輸入欄
//       // messagetitle.value = "";
//       content.value = "";

//       // 關閉 Modal
//       emit("update:modelValue", false);
//     } else {
//       alert("留言提交失敗");
//     }
//   } catch (error) {
//     console.error("留言提交錯誤:", error);
//     alert("留言提交失敗");
//   }
// };

//
// 處理 Modal 關閉的邏輯

const handleMessage = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    alert("請先登入！");
    return;
  }

  try {
    let uploadedFileUrl = null;
    if (file.value) {
      console.log("開始上傳檔案...");
      const { data } = await axios.get(
        "https://message-board-server-7yot.onrender.com/api/upload",
        {
          params: { filename: file.value.name, contentType: file.value.type },
        }
      );

      const { uploadUrl, fileUrl: tempFileUrl } = data;
      await axios.put(uploadUrl, file.value, {
        headers: { "Content-Type": file.value.type },
      });
      uploadedFileUrl = tempFileUrl;
      console.log("檔案上傳成功:", uploadedFileUrl);
    }

    // 如果沒有內容，設置為空字串
    const postContent = content.value || "";

    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/posts/${userId}`,
      { content: postContent, fileUrl: uploadedFileUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201) {
      // 發送 WebSocket 訊息
      socketStore.sendMessage({
        content: postContent,
        fileUrl: uploadedFileUrl,
      });

      // 清空輸入欄
      content.value = "";
      file.value = null;
      fileUrl.value = null; // 清空檔案 URL

      // 關閉 Modal
      emit("update:modelValue", false);
    } else {
      alert("留言提交失敗");
    }
  } catch (error) {
    console.error("留言提交錯誤:", error);
    alert("留言提交失敗");
  }
};

const handleModalClose = (newValue) => {
  // 當 Modal 關閉時，這個方法會被觸發
  if (content.value.trim() !== "") {
    const confirmClose = window.confirm("確認要關閉並清除內容嗎？");
    if (confirmClose) {
      content.value = ""; // 清空內容
      emit("update:modelValue", false);
      prevHeight.value = null; // 儲存上一次高度
    }
  } else {
    emit("update:modelValue", false);
  }
};

// 監聽 Modal 開啟，恢復高度
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (textarea.value) {
          textarea.value.style.height = prevHeight.value; // 恢復之前的高度
        }
      });
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
  flex-direction: column; /* 讓內部元素垂直排列 */
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
  border-radius: 50%;
  width: 50px;
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
  opacity: 0.7; /* 調整透明度 */
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
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
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

.light-mode .message-container {
  background: rgb(255, 255, 255);
}
.light-mode .user-content textarea {
  color: rgb(0, 0, 0);
}
</style>
