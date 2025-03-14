<!-- ChatView.vue
<template>
  <div class="container-box">
    <div class="container">
      <div class="icon-name">
        <div class="back-icon">
          <router-link to="#" @click.prevent="$router.back()">
            <img class="icon" :src="Backiconchat" alt="Backicon" />
          </router-link>
        </div>
        <router-link :to="`/@${friend.accountname}`" class="info">
          <img :src="friend.avatar_url" :alt="friend.name" class="avatar" />
          <div class="info-name">
            <span class="friend-name">{{ friend.name }}</span>
            <span class="friend-account-name">{{ friend.accountname }}</span>
          </div>
        </router-link>
      </div>

      <div class="messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'message',
            msg.senderId === currentUserId ? 'sent' : 'received',
          ]"
        >
          <span class="content">{{ msg.content }}</span>
          <img
            v-if="msg.media && msg.media.type === 'image'"
            :src="msg.media.data"
            alt="圖片"
            class="media"
          />
          <video
            v-if="msg.media && msg.media.type === 'video'"
            controls
            :src="msg.media.data"
            class="media"
          ></video>
          <span
            v-if="msg.senderId === currentUserId && msg.isRead"
            class="read-status"
            >已讀</span
          >
        </div>
      </div>
      <div class="input-area">
        <div class="file-upload-select">
          <input
            type="file"
            ref="fileInputRef"
            class="file-input"
            @change="handleFileUpload"
            style="display: none"
          />
          <button type="button" @click="triggerFileInput" class="submit-button">
            <img class="icon" :src="Noteicon" alt="Noteicon" />
          </button>
        </div>

        <div class="custom-input-container" ref="textareabox">
          <div v-if="fileUrl" class="file-preview">
            <div class="file-preview-position">
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
                <img class="icon" :src="Closeicon" alt="Close icon" />
              </button>
            </div>
          </div>

          <textarea
            v-model="newMessage"
            ref="textarea"
            @keyup.enter="sendMessage"
            placeholder="輸入訊息..."
            class="message-input"
          ></textarea>
        </div>

        <button @click="sendMessage" class="send-button">發送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { io } from "socket.io-client";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

import Backiconchat from "../assets/Backicon-chat.svg";
import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const props = defineProps({
  friendId: String,
});

const router = useRouter();
const message = useMessage();

// 定義響應式變數
const socket = ref(null);
const messages = ref([]);
const newMessage = ref("");
const textarea = ref(null);
const textareabox = ref(null);
const selectedFile = ref(null);
const currentUserId = ref(null);
const db = ref(null);
const friendName = ref("");
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);

// 動態調整高度的函數
const adjustTextareaHeight = () => {
  nextTick(() => {
    if (textarea.value && textareabox.value) {
      // 重置高度為初始值
      textarea.value.style.height = "auto"; // 先設為 auto 以正確計算 scrollHeight
      textareabox.value.style.height = "auto";

      // 計算文字內容高度（限制最大 100px）
      const textHeight = Math.min(textarea.value.scrollHeight, 100);

      // 設置 textarea 的高度
      textarea.value.style.height = `${textHeight}px`;

      // 計算總高度（文字高度 + 預覽區域高度）
      let totalHeight = textHeight;
      if (fileUrl.value) {
        totalHeight += 90; // 預覽區域高度 (80px + 10px padding)
      }

      // 設置 custom-input-container 的高度
      textareabox.value.style.height = `${totalHeight}px`;

      // 處理滾動條
      if (textarea.value.scrollHeight > 100) {
        textarea.value.style.overflowY = "auto";
      } else {
        textarea.value.style.overflowY = "hidden";
      }
    }
  });
};

// 監聽 newMessage 和 fileUrl 的變化
watch(
  [newMessage, fileUrl],
  () => {
    adjustTextareaHeight();
  },
  { immediate: true }
);

// onMounted 初始化高度
onMounted(() => {
  adjustTextareaHeight();
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
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

const friend = {
  id: 4,
  name: "胡摩豬",
  accountname: "shan4",
  avatar_url:
    "https://storage.googleapis.com/message_board_storage/1000006562.jpg",
};

onMounted(async () => {
  messages.value = [
    {
      id: "1",
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: "嗨！最近好嗎？",
      isRead: true,
    },
    {
      id: "2",
      senderId: props.friendId,
      receiverId: currentUserId.value,
      content: "我很好！你呢？",
      isRead: true,
    },
    {
      id: "3",
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: "這是張圖片！",
      media: {
        type: "image",
        data: "https://via.placeholder.com/150",
      },
      isRead: false,
    },
    {
      id: "4",
      senderId: props.friendId,
      receiverId: currentUserId.value,
      content: "這是一段影片！",
      media: {
        type: "video",
        data: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
      },
      isRead: false,
    },
    {
      id: "5",
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: "嗨！最近好嗎？",
      isRead: true,
    },
    {
      id: "6",
      senderId: props.friendId,
      receiverId: currentUserId.value,
      content: "我很好！你呢？",
      isRead: true,
    },
    {
      id: "7",
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: "嗨！最近好嗎？",
      isRead: true,
    },
    {
      id: "8",
      senderId: props.friendId,
      receiverId: currentUserId.value,
      content: "我很好！你呢？",
      isRead: true,
    },
  ];
});

const loadMessages = async () => {
  const allMessages = await db.value.getAll("messages");
  console.log("從 IndexedDB 載入消息:", allMessages);
  messages.value = allMessages.filter(
    (msg) =>
      (msg.senderId === currentUserId.value &&
        msg.receiverId === props.friendId) ||
      (msg.senderId === props.friendId &&
        msg.receiverId === currentUserId.value)
  );
  console.log("更新後的 messages 陣列:", messages.value);
};

// 儲存消息到 IndexedDB
const saveMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
};

// 更新消息到 IndexedDB
const updateMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
  const msg = messages.value.find((m) => m.id === message.id);
  if (msg) Object.assign(msg, message);
};

// 添加或更新消息到本地陣列
const addOrUpdateMessage = (message) => {
  const existingMsg = messages.value.find((m) => m.id === message.id);
  if (existingMsg) {
    Object.assign(existingMsg, message);
  } else {
    messages.value.push({ ...message });
  }
};

// 發送消息
const sendMessage = async () => {
  if (newMessage.value.trim() || selectedFile.value) {
    const message = {
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: newMessage.value,
      media: selectedFile.value ? await processFile(selectedFile.value) : null,
    };
    console.log("發送消息:", message);
    socket.value.emit("sendMessage", message);
    newMessage.value = "";
    selectedFile.value = null;
  }
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
        adjustTextareaHeight(); // 上傳後調整高度
      };
      reader.onerror = () => {
        message.error("圖片讀取失敗！");
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type.startsWith("video/")) {
      fileUrl.value = URL.createObjectURL(selectedFile);
      adjustTextareaHeight(); // 上傳後調整高度
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
  adjustTextareaHeight(); // 上傳後調整高度
};

// 處理檔案轉換為 Data URL
const processFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        type: file.type.startsWith("image") ? "image" : "video",
        data: e.target.result,
      });
    reader.readAsDataURL(file);
  });
};

// 標記消息為已讀
const markAsRead = (messageId, senderId, receiverId) => {
  console.log("標記已讀:", { messageId, senderId, receiverId });
  socket.value.emit("markAsRead", { messageId, senderId, receiverId });
};

// 獲取好友名稱
const fetchFriendName = async () => {
  try {
    const response = await apiClient.get("/api/friends");
    const friend = response.data.find(
      (f) => f.id.toString() === props.friendId
    );
    friendName.value = friend ? friend.name : "未知好友";
  } catch (err) {
    console.error("獲取好友名稱失敗:", err);
    friendName.value = "未知好友";
  }
};

// 獲取當前用戶 ID
const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    currentUserId.value = response.data.id.toString();
    console.log("當前用戶 ID:", currentUserId.value);
    // 只有在成功獲取用戶 ID 後才繼續後續初始化
    await fetchFriendName();
    await loadMessages();

    socket.value = io("wss://message-board-server-7yot.onrender.com", {
      query: { userId: currentUserId.value },
    });

    socket.value.on("connect", () => {
      console.log("WebSocket 連接成功");
    });

    socket.value.on("connect_error", (err) => {
      console.log("WebSocket 連接錯誤:", err);
    });

    socket.value.on("receiveMessage", async (message) => {
      console.log("收到消息:", message);
      await saveMessage(message);
      if (
        (message.senderId === props.friendId &&
          message.receiverId === currentUserId.value) ||
        (message.receiverId === props.friendId &&
          message.senderId === currentUserId.value)
      ) {
        addOrUpdateMessage(message);
      }
      if (message.receiverId === currentUserId.value && !message.isRead) {
        markAsRead(message.id, message.senderId, message.receiverId);
      }
    });

    socket.value.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await saveMessage(message);
      if (
        (message.senderId === currentUserId.value &&
          message.receiverId === props.friendId) ||
        (message.receiverId === currentUserId.value &&
          message.senderId === props.friendId)
      ) {
        addOrUpdateMessage(message);
      }
    });

    socket.value.on("messageRead", async ({ messageId }) => {
      console.log("收到消息已讀通知:", messageId);
      let msg = messages.value.find((m) => m.id === messageId);
      if (msg) {
        msg.isRead = true;
        await updateMessage(msg);
        console.log("更新現有消息已讀狀態:", msg);
        messages.value = [...messages.value];
      } else {
        console.log(
          `消息 ${messageId} 未在當前 messages 中，嘗試從 IndexedDB 載入`
        );
        const allMessages = await db.value.getAll("messages");
        const missingMsg = allMessages.find((m) => m.id === messageId);
        if (missingMsg) {
          missingMsg.isRead = true;
          await saveMessage(missingMsg);
          if (
            (missingMsg.senderId === currentUserId.value &&
              missingMsg.receiverId === props.friendId) ||
            (missingMsg.receiverId === currentUserId.value &&
              missingMsg.senderId === props.friendId)
          ) {
            addOrUpdateMessage(missingMsg);
            console.log("從 IndexedDB 載入並更新消息:", missingMsg);
            messages.value = [...messages.value];
          }
        } else {
          console.log(`消息 ${messageId} 在 IndexedDB 中也未找到`);
        }
      }
    });

    socket.value.on("syncMessages", async (messagesData) => {
      console.log("收到短期同步消息:", messagesData);
      for (const message of messagesData) {
        await saveMessage(message);
        if (
          (message.senderId === currentUserId.value &&
            message.receiverId === props.friendId) ||
          (message.receiverId === currentUserId.value &&
            message.senderId === props.friendId)
        ) {
          addOrUpdateMessage(message);
        }
        if (message.receiverId === currentUserId.value && !message.isRead) {
          markAsRead(message.id, message.senderId, message.receiverId);
        }
      }
    });
  } catch (err) {
    console.error(
      "獲取用戶 ID 失敗:",
      err.response?.data?.message || err.message
    );
    // router.push("/login"); // 跳轉至登入頁面
  }
};

// 頁面掛載時執行
onMounted(async () => {
  db.value = await openDB("chatDB", 1, {
    upgrade(db) {
      db.createObjectStore("messages", { keyPath: "id" });
    },
  });
  await fetchCurrentUser();
});

// 頁面卸載前斷開 WebSocket
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.container-box {
  width: 650px;
  height: 95vh;
  display: flex;
  justify-self: center;
  flex-direction: column;
  position: relative;
}

.icon-name {
  display: flex;
  padding: 10px 30px;
  gap: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.back-icon {
  margin: 15px 0 15px 5px;
  display: flex;
}

.back-icon a {
  display: flex;
}
.back-icon img {
  width: 24px;
}

.container .info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.container .info-name {
  display: flex;
  flex-direction: column;
}

.container .info .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.messages {
  padding: 10px;
  height: calc(100% - 170px);
  overflow-y: auto;
  overflow-x: hidden;
}

.message {
  max-width: 60%;
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
}

.message.sent {
  background-color: #eedfcc;
  margin-left: auto;
  position: relative;
}

.message.received {
  background-color: #e9ecef;
  margin-right: auto;
}

.content {
  word-wrap: break-word;
}

.media {
  max-width: 100%;
  margin-top: 5px;
  border-radius: 8px;
}

.file-input {
  display: none;
}

.read-status {
  position: absolute;
  left: -30px;
  bottom: 0;
  font-size: 12px;
  text-align: center;
  opacity: 0.7;
}

/* textarea */
.input-area {
  display: flex;
  padding: 15px;
  margin: 15px;
  gap: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  align-items: flex-end;
  box-sizing: border-box;
  background-color: #fff;
}

.custom-input-container {
  flex: 1;
  gap: 5px;
  flex-direction: column;
  overflow: hidden;
  display: inline-flex;
  padding: 8px;
}

.message-input {
  font-size: 14px;
  width: 100%;
  padding: 0px 5px;
  outline: none;
  border: none;
  resize: none;
  line-height: 1.2;
  box-sizing: border-box;
}

.file-preview {
  display: flex;
  justify-content: flex-start;
}

.file-preview-position {
  position: relative;
  display: flex;
}

.preview-img,
.preview-video {
  max-width: 100%;
  max-height: 80px;
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

.file-upload-select {
  display: flex;
}

.send-button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.send-button:hover {
}
</style> -->

<!-- ChatView.vue  version 2-->
<template>
  <div class="container-box">
    <div class="container">
      <div class="icon-name">
        <div class="back-icon">
          <router-link to="#" @click.prevent="$router.back()">
            <img class="icon" :src="Backiconchat" alt="Backicon" />
          </router-link>
        </div>
        <router-link :to="`/@${friend.accountname}`" class="info">
          <img :src="friend.avatar_url" :alt="friend.name" class="avatar" />
          <div class="info-name">
            <span class="friend-name">{{ friend.name }}</span>
            <span class="friend-account-name">{{ friend.accountname }}</span>
          </div>
        </router-link>
      </div>

      <div class="messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'message',
            msg.senderId === currentUserId ? 'sent' : 'received',
          ]"
        >
          <span class="content">{{ msg.content }}</span>
          <img
            v-if="msg.media && msg.media.type === 'image'"
            :src="msg.media.data"
            alt="圖片"
            class="media"
          />
          <video
            v-if="msg.media && msg.media.type === 'video'"
            controls
            :src="msg.media.data"
            class="media"
          ></video>
          <span
            v-if="msg.senderId === currentUserId && msg.isRead"
            class="read-status"
            >已讀</span
          >
        </div>
      </div>

      <div class="input-area">
        <div class="file-upload-select">
          <input
            type="file"
            ref="fileInputRef"
            class="file-input"
            @change="handleFileUpload"
            style="display: none"
          />
          <button type="button" @click="triggerFileInput" class="submit-button">
            <img class="icon" :src="Noteicon" alt="Noteicon" />
          </button>
        </div>

        <div class="custom-input-container" ref="textareabox">
          <div v-if="fileUrl" class="file-preview">
            <div class="file-preview-position">
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
                <img class="icon" :src="Closeicon" alt="Close icon" />
              </button>
            </div>
          </div>

          <textarea
            v-model="newMessage"
            ref="textarea"
            placeholder="輸入訊息..."
            @keyup.enter="sendMessage"
            class="message-input"
          ></textarea>
        </div>

        <button @click="sendMessage" class="send-button">發送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { io } from "socket.io-client";
import { openDB } from "idb";
import apiClient from "../stores/axiosConfig";

import Backiconchat from "../assets/Backicon-chat.svg";
import Noteicon from "../assets/Noteicon.svg";
import Closeicon from "../assets/Closeicon.svg";

const props = defineProps({
  friendId: String,
});

const router = useRouter();
const message = useMessage();

// 定義響應式變數
const socket = ref(null);
const messages = ref([]);
const newMessage = ref("");
const textarea = ref(null);
const textareabox = ref(null);
const selectedFile = ref(null);
const currentUserId = ref(null);
const db = ref(null);
const friendName = ref("");
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);
const friend = ref({
  name: "載入中...",
  accountname: "",
  avatar_url: "",
});

// 動態調整高度的函數
// const adjustTextareaHeight = () => {
//   nextTick(() => {
//     if (textarea.value && textareabox.value) {
//       textarea.value.style.height = "auto";
//       textareabox.value.style.height = "auto";
//       const textHeight = Math.min(textarea.value.scrollHeight, 100);
//       textarea.value.style.height = `${textHeight}px`;
//       let totalHeight = textHeight;
//       if (fileUrl.value) {
//         totalHeight += 90;
//       }
//       textareabox.value.style.height = `${totalHeight}px`;
//       if (textarea.value.scrollHeight > 100) {
//         textarea.value.style.overflowY = "auto";
//       } else {
//         textarea.value.style.overflowY = "hidden";
//       }
//     }
//   });
// };

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (textarea.value && textareabox.value) {
      textarea.value.style.height = "auto";
      textareabox.value.style.height = "auto";

      // 獲取行高（從 CSS 或預設值）
      const lineHeight =
        parseInt(getComputedStyle(textarea.value).lineHeight) || 20; // 默認 20px
      // 計算行數，根據換行符
      const lines = (newMessage.value || "").split("\n").length;
      // 計算文字區域高度，至少一行，最大 100px
      const textHeight = Math.min(
        Math.max(lines * lineHeight, lineHeight),
        100
      );

      textarea.value.style.height = `${textHeight}px`;

      // 計算總高度（包括文件預覽）
      let totalHeight = textHeight;
      if (fileUrl.value) {
        totalHeight += 90; // 文件預覽高度
      }
      textareabox.value.style.height = `${totalHeight}px`;

      // 處理滾動條
      if (textarea.value.scrollHeight > 100) {
        textarea.value.style.overflowY = "auto";
      } else {
        textarea.value.style.overflowY = "hidden";
      }
    }
  });
};

// 監聽 newMessage 和 fileUrl 的變化
watch(
  [newMessage, fileUrl],
  () => {
    adjustTextareaHeight();
  },
  { immediate: true }
);

// onMounted 初始化高度
onMounted(() => {
  adjustTextareaHeight();
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
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

const scrollToBottom = () => {
  nextTick(() => {
    const messagesContainer = document.querySelector(".messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
};

const loadMessages = async () => {
  const allMessages = await db.value.getAll("messages");
  console.log("從 IndexedDB 載入消息:", allMessages);
  messages.value = allMessages.filter(
    (msg) =>
      (msg.senderId === currentUserId.value &&
        msg.receiverId === props.friendId) ||
      (msg.senderId === props.friendId &&
        msg.receiverId === currentUserId.value)
  );
  console.log("更新後的 messages 陣列:", messages.value);
  scrollToBottom();
};

// 儲存消息到 IndexedDB
const saveMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
};

// 更新消息到 IndexedDB
const updateMessage = async (message) => {
  const tx = db.value.transaction("messages", "readwrite");
  await tx.store.put({ ...message });
  await tx.done;
  const msg = messages.value.find((m) => m.id === message.id);
  if (msg) Object.assign(msg, message);
};

// 添加或更新消息到本地陣列
const addOrUpdateMessage = (message) => {
  const existingMsg = messages.value.find((m) => m.id === message.id);
  if (existingMsg) {
    Object.assign(existingMsg, message);
  } else {
    messages.value.push({ ...message });
  }
};

// 發送消息
const sendMessage = async () => {
  if (newMessage.value.trim() || selectedFile.value) {
    const message = {
      senderId: currentUserId.value,
      receiverId: props.friendId,
      content: newMessage.value,
      media: selectedFile.value ? await processFile(selectedFile.value) : null,
    };
    console.log("發送消息:", message);
    socket.value.emit("sendMessage", message);
    newMessage.value = "";
    selectedFile.value = null;
    scrollToBottom();
  }
};

// 檢查檔案上傳處理，並顯示預覽
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
        adjustTextareaHeight(); // 上傳後調整高度
      };
      reader.onerror = () => {
        message.error("圖片讀取失敗！");
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type.startsWith("video/")) {
      fileUrl.value = URL.createObjectURL(selectedFile);
      adjustTextareaHeight(); // 上傳後調整高度
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

// 取消檔案預覽，重設檔案選擇
const cancelFilePreview = () => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
  fileUrl.value = null;
  file.value = null;
  if (fileInputRef.value) fileInputRef.value.value = null;
  adjustTextareaHeight(); // 取消後調整高度
};

// 處理檔案轉換為 Data URL
const processFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        type: file.type.startsWith("image") ? "image" : "video",
        data: e.target.result,
      });
    reader.readAsDataURL(file);
  });
};

// 標記消息為已讀
const markAsRead = (messageId, senderId, receiverId) => {
  console.log("標記已讀:", { messageId, senderId, receiverId });
  socket.value.emit("markAsRead", { messageId, senderId, receiverId });
};

// 獲取好友名稱
const fetchFriendName = async () => {
  try {
    const response = await apiClient.get("/friends");
    console.log("API 回應:", response.data); // 檢查返回數據
    const friendData = response.data.find(
      (f) => f.id.toString() === props.friendId
    );
    console.log("找到的好友:", friendData); // 檢查 friendData
    if (friendData) {
      friend.value = {
        id: friendData.id,
        name: friendData.name,
        accountname: friendData.accountname || friendData.username || "",
        avatar_url: friendData.avatar_url || "",
      };
    } else {
      friend.value = {
        name: "未知好友",
        accountname: "",
        avatar_url: "",
      };
    }
  } catch (err) {
    console.error("獲取好友名稱失敗:", err);
    friend.value = {
      name: "未知好友",
      accountname: "",
      avatar_url: "",
    };
  }
  console.log("最終 friend.value:", friend.value); // 檢查最終結果
};

// 獲取當前用戶 ID
const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    currentUserId.value = response.data.id.toString();
    console.log("當前用戶 ID:", currentUserId.value);
    await fetchFriendName();
    await loadMessages();

    socket.value = io("wss://message-board-server-7yot.onrender.com", {
      query: { userId: currentUserId.value },
    });

    socket.value.on("connect", () => {
      console.log("WebSocket 連接成功");
    });

    socket.value.on("connect_error", (err) => {
      console.log("WebSocket 連接錯誤:", err);
    });

    socket.value.on("receiveMessage", async (message) => {
      console.log("收到消息:", message);
      await saveMessage(message);
      if (
        (message.senderId === props.friendId &&
          message.receiverId === currentUserId.value) ||
        (message.receiverId === props.friendId &&
          message.senderId === currentUserId.value)
      ) {
        addOrUpdateMessage(message);
        scrollToBottom();
      }
      if (message.receiverId === currentUserId.value && !message.isRead) {
        markAsRead(message.id, message.senderId, message.receiverId);
      }
    });

    socket.value.on("messageSent", async (message) => {
      console.log("消息已發送:", message);
      await saveMessage(message);
      if (
        (message.senderId === currentUserId.value &&
          message.receiverId === props.friendId) ||
        (message.receiverId === currentUserId.value &&
          message.senderId === props.friendId)
      ) {
        addOrUpdateMessage(message);
        scrollToBottom();
      }
    });

    socket.value.on("messageRead", async ({ messageId }) => {
      console.log("收到消息已讀通知:", messageId);
      let msg = messages.value.find((m) => m.id === messageId);
      if (msg) {
        msg.isRead = true;
        await updateMessage(msg);
        console.log("更新現有消息已讀狀態:", msg);
        messages.value = [...messages.value];
      } else {
        console.log(
          `消息 ${messageId} 未在當前 messages 中，嘗試從 IndexedDB 載入`
        );
        const allMessages = await db.value.getAll("messages");
        const missingMsg = allMessages.find((m) => m.id === messageId);
        if (missingMsg) {
          missingMsg.isRead = true;
          await saveMessage(missingMsg);
          if (
            (missingMsg.senderId === currentUserId.value &&
              missingMsg.receiverId === props.friendId) ||
            (missingMsg.receiverId === currentUserId.value &&
              missingMsg.senderId === props.friendId)
          ) {
            addOrUpdateMessage(missingMsg);
            scrollToBottom();
            console.log("從 IndexedDB 載入並更新消息:", missingMsg);
            messages.value = [...messages.value];
          }
        } else {
          console.log(`消息 ${messageId} 在 IndexedDB 中也未找到`);
        }
      }
    });

    socket.value.on("syncMessages", async (messagesData) => {
      console.log("收到短期同步消息:", messagesData);
      for (const message of messagesData) {
        await saveMessage(message);
        if (
          (message.senderId === currentUserId.value &&
            message.receiverId === props.friendId) ||
          (message.receiverId === currentUserId.value &&
            message.senderId === props.friendId)
        ) {
          addOrUpdateMessage(message);
          scrollToBottom();
        }
        if (message.receiverId === currentUserId.value && !message.isRead) {
          markAsRead(message.id, message.senderId, message.receiverId);
        }
      }
    });
  } catch (err) {
    console.error(
      "獲取用戶 ID 失敗:",
      err.response?.data?.message || err.message
    );
    router.push("/login");
  }
};

// 頁面掛載時執行
onMounted(async () => {
  db.value = await openDB("chatDB", 1, {
    upgrade(db) {
      db.createObjectStore("messages", { keyPath: "id" });
    },
  });
  await fetchCurrentUser();
});

// 頁面卸載前斷開 WebSocket
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.container-box {
  width: 650px;
  height: 95vh;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  margin-top: 2.5vh;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.icon-name {
  display: flex;
  padding: 10px 30px;
  gap: 20px;
  border-bottom: 0.5px solid #373737;
}

.back-icon {
  margin: 15px 0 15px 5px;
  display: flex;
}

.back-icon a {
  display: flex;
}
.back-icon img {
  width: 24px;
}

.container .info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.container .info-name {
  display: flex;
  flex-direction: column;
}

.container .info .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 100px;
}

.message {
  max-width: 60%;
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 8px;
}

.message.sent {
  background-color: #eedfcc;
  margin-left: auto;
  position: relative;
}

.message.received {
  background-color: #e9ecef;
  margin-right: auto;
}

.content {
  word-wrap: break-word;
  white-space: pre-wrap;
  color: #000;
}

.media {
  max-width: 100%;
  margin-top: 5px;
  border-radius: 8px;
}

.file-input {
  display: none;
}

.read-status {
  position: absolute;
  left: -30px;
  bottom: 0;
  font-size: 12px;
  text-align: center;
  opacity: 0.7;
}

.input-area {
  display: flex;
  padding: 10px;
  margin: 15px;
  gap: 10px;
  border: 0.5px solid #373737;
  border-radius: 20px;
  align-items: flex-end;
  box-sizing: border-box;
  height: auto;
  min-height: 60px;
}

.custom-input-container {
  flex: 1;
  gap: 5px;
  flex-direction: column;
  overflow: hidden;
  display: inline-flex;
  padding: 8px;
}

.message-input {
  font-size: 14px;
  width: 100%;
  padding: 0px 5px;
  outline: none;
  border: none;
  resize: none;
  line-height: 1.2;
  box-sizing: border-box;
  color: #fff;
  background-color: transparent !important;
}

.light-mode .message-input {
  color: #000;
}

.file-preview {
  display: flex;
  justify-content: flex-start;
}

.file-preview-position {
  position: relative;
  display: flex;
}

.preview-img,
.preview-video {
  max-width: 100%;
  max-height: 80px;
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

.file-upload-select {
  display: flex;
}

.send-button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.send-button:hover {
  color: #373737 !important;
}

@media (max-width: 500px) {
  .container-box {
    width: 100%;
    height: 80vh;
    margin-top: 10vh;
    overflow: hidden;
  }
}
</style>
