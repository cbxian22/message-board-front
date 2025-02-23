<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { NButton, NDrawerContent, NDrawer, useLoadingBar } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { useRouter } from "vue-router";
import axios from "axios";
import Login from "../components/LoginModal.vue";

const themeStore = useThemeStore();
const loadingBar = useLoadingBar();
const router = useRouter();
const authStore = useAuthStore();

const loggedInUser = authStore.userName;
const username = router.currentRoute.value.params.username;
const show = ref(false);
const rwdwidth = ref("100vw"); // 預設手機版
const info = ref({}); // 初始為空物件
const name = ref("");
const intro = ref("");
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);
const tempAvatar = ref(null); // 初始為 null 存放暫存圖片（選擇的圖片）
const isLoginModalOpen = ref(false);

// 當抽屜顯示時，預填入現有資料
watch(show, (newValue) => {
  if (newValue) {
    // 抽屜打開時，將 info 的值填入 name 和 intro
    name.value = info.value.name || "";
    intro.value = info.value.intro || "";
    tempAvatar.value = info.value.userAvatar;
  } else {
    // 抽屜關閉時清空
    tempAvatar.value = null;
    name.value = "";
    intro.value = "";
    file.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = null;
    }
  }
});

const checkTokenAndOpenModal = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    isLoginModalOpen.value = true;
  } else {
  }
};

// 獲取 user 資料
const fetchInfo = async () => {
  const username = router.currentRoute.value.params.username; // 這裡重新獲取 username
  try {
    const response = await axios.get(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`
    );

    if (response.status === 200 && response.data) {
      info.value = {
        id: response.data.id,
        name: response.data.name,
        intro: response.data.intro,
        userAvatar: response.data.avatar_url,
      };
      tempAvatar.value = info.value.userAvatar; // 如果沒有圖片，使用預設圖片
    } else {
      alert("無法獲取留言，數據格式不正確");
    }
  } catch (error) {
    console.error("取得留言錯誤:", error);
    alert("留言取得失敗，請檢查網絡或稍後再試");
  }
};

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
        console.log("圖片資料 URL:", e.target.result); // 在這裡檢查圖片資料
        tempAvatar.value = e.target.result; // 更新 tempAvatar
      };
      reader.readAsDataURL(selectedFile);
    }
    file.value = selectedFile; // 存檔案，確保後續上傳
  }
};

// 獨立處理圖片上傳
const uploadFile = async () => {
  if (!file.value) return null;

  try {
    console.log("開始上傳檔案...");
    const { data } = await axios.get(
      "https://message-board-server-7yot.onrender.com/api/upload",
      {
        params: { filename: file.value.name, contentType: file.value.type },
      }
    );

    await axios.put(data.uploadUrl, file.value, {
      headers: { "Content-Type": file.value.type },
    });

    console.log("檔案上傳成功:", data.fileUrl);
    return data.fileUrl;
  } catch (error) {
    console.error("檔案上傳失敗:", error);
    return null;
  }
};

// 提交更新
const handleUpdate = async () => {
  if (name.value === info.value.name && intro.value === info.value.intro) {
    show.value = false;
    return;
  }

  const username = router.currentRoute.value.params.username;

  // 即使是自己也需要登入後修改
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (!userId || !token) {
    alert("請先登入！");
    return;
  }

  loadingBar.start(); // 驗證通過 且 請求開始前 啟動 Loading

  try {
    const uploadedFileUrl = await uploadFile(); // 獨立處理圖片上傳
    const response = await axios.put(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`,
      { name: name.value, intro: intro.value, fileUrl: uploadedFileUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200) {
      // 發送 WebSocket 訊息
      // socketStore.sendMessage({
      //   content: content.value,
      //   fileUrl: uploadedFileUrl,
      // });

      name.value = "";
      intro.value = "";
      file.value = null;
      fileUrl.value = null;
      show.value = false;
      await fetchInfo();
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

// 更新抽屜視窗寬度
const updateWidth = () => {
  const width = window.innerWidth;
  if (width >= 1024) {
    rwdwidth.value = 800;
  } else if (width >= 768) {
    rwdwidth.value = 600;
  } else {
    rwdwidth.value = "100vw";
  }
};

onMounted(() => {
  fetchInfo();
  updateWidth();
  window.addEventListener("resize", updateWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});
</script>

<template>
  <div class="info-box">
    <div class="info-box-in">
      <div class="info-content">
        <p class="name">{{ info.name }}</p>
        <p class="intro">{{ info.intro }}</p>
      </div>
      <div class="info-img">
        <img :src="info.userAvatar" />
      </div>
    </div>

    <!-- 切換 -->
    <div class="set-btn" v-if="loggedInUser === username">
      <n-button @click="show = true"> 編輯個人檔案 </n-button>
    </div>

    <!-- 切換 -->
    <div
      @click="checkTokenAndOpenModal"
      class="set-btn"
      v-if="loggedInUser !== username"
    >
      <n-button> 加入好友 </n-button>
    </div>

    <!-- 抽屜視窗 -->
    <n-drawer v-model:show="show" :width="rwdwidth">
      <n-drawer-content
        title="編輯個人檔案"
        closable
        :class="themeStore.isDarkMode ? 'dark-mode' : 'light-mode'"
      >
        <form @submit.prevent="handleUpdate" class="container">
          <div class="form-box">
            <div class="form-inner">
              <div class="form-mod full">
                <label for="name">名稱</label>
                <!-- <input
                  v-model="name"
                  id="name"
                  type="text"
                  :placeholder="namePlaceholder"
                /> -->
                <input v-model="name" id="name" type="text" />
              </div>
              <div class="form-mod">
                <label for="userAvatar"></label>
                <input
                  type="file"
                  ref="fileInputRef"
                  @change="handleFileUpload"
                  id="userAvatar"
                  accept="image/*"
                  style="display: none"
                />
                <img
                  :src="tempAvatar || info.userAvatar"
                  alt="更新圖片"
                  type="button"
                  @click="triggerFileInput"
                  class="submit-button"
                />
              </div>
            </div>
          </div>

          <div class="form-box">
            <div class="form-mod">
              <label for="intro">個人介紹</label>
              <!-- <textarea
                v-model="intro"
                id="intro"
                :placeholder="introPlaceholder"
              ></textarea> -->
              <textarea v-model="intro" id="intro"></textarea>
            </div>
          </div>

          <div class="form-box">
            <div class="form-mod">
              <n-button @click="handleUpdate">保存變更</n-button>
            </div>
          </div>
        </form>
      </n-drawer-content>
    </n-drawer>
  </div>

  <!-- 登入 Modal -->
  <Login v-model="isLoginModalOpen" />
</template>

<style scoped>
.info-box {
  padding: 40px 50px 25px;
  border-bottom: 0.5px solid #373737;
}
.info-box-in {
  display: flex;
  justify-content: space-between;
}
.info-box img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.info-box .info-content {
  max-width: 250px;
  display: flex;
  flex-direction: column;
}

.info-content > .name {
  font-size: 25px !important;
  margin-bottom: 10px;
}

.info-content > .intro {
  font-size: 13px !important;
}

.set-btn {
  margin-top: 40px;
  flex: 1;
  display: flex;
  align-items: center;
}

.n-button {
  --n-text-color-hover: #000 !important;
  --n-border-hover: 1px solid #000 !important;
  --n-text-color-pressed: none !important;
  --n-border-focus: none !important;
  --n-border-pressed: none !important;
  --n-text-color-focus: none !important;
}

.dark-mode .n-button {
  --n-text-color-hover: #fff !important;
  --n-border-hover: 1px solid #fff !important;
}

.set-btn .n-button,
.form-mod .n-button {
  width: 100%;
  padding: 10px 20px;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
  border-radius: 10px;
}

/* 抽屜視窗 */
.container {
  background-color: rgb(24, 24, 24);
  padding: 30px;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  border: 0.5px solid rgb(55, 55, 55);
  gap: 30px;
}

.form-box {
  border-bottom: 0.5px solid rgb(55, 55, 55);
}

.form-box:last-child {
  border-bottom: none;
}

.form-inner {
  display: flex;
  display: row;
  justify-content: space-between;
}

.form-inner .full {
  flex: 1;
  /* margin-right: 50px; */
}

.form-box textarea,
.form-box input {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding: 20px 0;
  color: rgb(243, 245, 247);
}

.light-mode .form-box textarea,
.light-mode .form-box input {
  color: rgb(0, 0, 0) !important;
}

.form-mod {
  display: flex;
  flex-direction: column;
}

/* 頭貼按鈕 */
.submit-button {
  cursor: pointer;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
