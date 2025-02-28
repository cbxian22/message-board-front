<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  NSwitch,
  NButton,
  NDrawerContent,
  NDrawer,
  useLoadingBar,
} from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";
import Login from "./ModalLogin.vue";

const props = defineProps({
  userData: Object, // 從父組件接收用戶資料
});

const themeStore = useThemeStore();
const loadingBar = useLoadingBar();
const router = useRouter();
const authStore = useAuthStore();

const loggedInUser = ref(authStore.userName);
const show = ref(false);
const rwdwidth = ref("100vw");
const info = ref({});
const name = ref("");
const intro = ref("");
const file = ref(null);
const fileInputRef = ref(null);
const tempAvatar = ref(null);
const isLoginModalOpen = ref(false);
const is_private = ref(false);

// 監聽 authStore.userName 的變化並同步 loggedInUser
watch(
  () => authStore.userName,
  (newName) => {
    loggedInUser.value = newName;
  }
);

// 初始化檢查登入狀態，並監聽 authStore 變化
onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});

watch(
  () => props.userData,
  (newData) => {
    if (newData) {
      info.value = {
        ...newData,
        is_private: Boolean(newData.is_private), // 統一轉為布林值
      };
      console.log("Updated info.value:", info.value); // 調試
    }
  },
  { immediate: true }
);

// 當抽屜顯示時，預填入現有資料
watch(show, (newValue) => {
  if (newValue) {
    name.value = info.value.name || "";
    intro.value = info.value.intro || "";
    tempAvatar.value = info.value.userAvatar;
    is_private.value = info.value.is_private;
    console.log("Drawer opened - is_private:", is_private.value); // 調試
  } else {
    tempAvatar.value = null;
    name.value = "";
    intro.value = "";
    file.value = null;
    if (fileInputRef.value) fileInputRef.value.value = null;
  }
});

const checkTokenAndOpenModal = () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
  }
};

// 觸發檔案輸入
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 處理檔案上傳並顯示預覽
const handleFileUpload = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile && selectedFile.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      tempAvatar.value = e.target.result;
    };
    reader.readAsDataURL(selectedFile);
    file.value = selectedFile;
  }
};

// 上傳檔案到後端
const uploadFile = async () => {
  if (!file.value) return null;

  try {
    const { data } = await apiClient.get("/upload", {
      params: { filename: file.value.name, contentType: file.value.type },
    });

    await apiClient.put(data.uploadUrl, file.value, {
      headers: { "Content-Type": file.value.type },
    });

    return data.fileUrl;
  } catch (error) {
    console.error("檔案上傳失敗:", error);
    return null;
  }
};

// 提交更新
const handleUpdate = async () => {
  if (info.value.name !== authStore.userName) {
    alert("您只能編輯自己的資料！");
    show.value = false;
    return;
  }

  if (
    name.value === info.value.name &&
    intro.value === info.value.intro &&
    tempAvatar.value === info.value.userAvatar &&
    is_private.value === info.value.is_private
  ) {
    show.value = false;
    return;
  }

  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    isLoginModalOpen.value = true;
    return;
  }

  loadingBar.start();
  try {
    const uploadedFileUrl = await uploadFile();
    const response = await apiClient.put("/users/profile", {
      name: name.value,
      intro: intro.value,
      fileUrl: uploadedFileUrl || info.value.userAvatar,
      isPrivate: is_private.value,
    });

    console.log("後端回應:", response.data);

    if (response.status === 200) {
      authStore.userName = name.value;
      authStore.userAvatar = uploadedFileUrl || info.value.userAvatar;
      localStorage.setItem("userName", authStore.userName);
      localStorage.setItem("userAvatar", authStore.userAvatar);
      loggedInUser.value = name.value;

      info.value = {
        ...info.value,
        name: name.value,
        intro: intro.value,
        userAvatar: uploadedFileUrl || info.value.userAvatar,
        is_private: is_private.value,
      };

      await nextTick();
      emitter.emit("refreshPost", { newUsername: name.value });
      await router.push(`/@${name.value}`);
      show.value = false;
    } else {
      alert("更新失敗");
      loadingBar.error();
    }
  } catch (error) {
    console.error("更新錯誤:", error);
    if (error.response?.status === 401) {
      alert("登入已過期，請重新登入");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else {
      alert("更新失敗，請稍後再試");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

// 更新抽屜寬度
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

const handleDelete = async () => {
  if (info.value.name !== authStore.userName) {
    alert("您只能刪除自己的資料！");
    show.value = false;
    return;
  }

  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    isLoginModalOpen.value = true;
    return;
  }

  loadingBar.start();

  try {
    authStore.logout();
    const response = await apiClient.delete("/users/profile");
    show.value = false;
    console.log("刪除使用者成功:", response.data.message);
    alert("使用者已成功刪除");
    window.location.href = "/";
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || "未知錯誤";
    console.error("刪除失敗:", errorMessage);
    alert("刪除失敗: " + errorMessage);
  } finally {
    loadingBar.finish();
  }
};
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
    <div class="set-btn" v-if="loggedInUser === info.name">
      <n-button @click="show = true"> 編輯個人檔案 </n-button>
    </div>

    <!-- 切換 -->
    <div
      class="set-btn"
      v-if="loggedInUser !== info.name"
      @click="checkTokenAndOpenModal"
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
              <textarea v-model="intro" id="intro"></textarea>
            </div>
          </div>

          <div class="form-box">
            <div class="form-mod">
              <label for="intro">變更隱私</label>
              <div class="toggle-container">
                <div>
                  <span>公開</span>
                  <n-switch v-model:value="is_private" />
                  <span>私人</span>
                </div>
                <button @click="handleDelete">刪除帳號</button>
              </div>
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

    <div v-show="info.is_private">這是私人帳號，加入好友即可查看對方貼文。</div>
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
  --n-ripple-color: none !important;
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
}

.form-box textarea,
.form-box input,
.form-box .toggle-container {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding: 20px 0;
  color: rgb(243, 245, 247);
  line-height: 1.5; /* 確保行高一致 */
  height: 60px; /* 明確給 textarea 高度 */
}

.light-mode .form-box textarea,
.light-mode .form-box input,
.light-mode .form-box .toggle-container {
  color: rgb(0, 0, 0) !important;
}
.form-box .toggle-container {
  display: flex;
  justify-content: space-between;
  cursor: default;
}

.form-box .toggle-container .n-switch {
  padding: 0 25px;
}

.toggle-container button {
  color: red;
  font-weight: 600;
}
.toggle-container button:hover {
  text-decoration: underline;
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

/* 隱私切換樣式 */
.privacy-toggle .toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.privacy-toggle span {
  font-size: 14px;
  color: rgb(243, 245, 247);
}

.light-mode .privacy-toggle span {
  color: rgb(0, 0, 0);
}

.privacy-toggle .n-switch {
  margin: 0 5px;
}
</style>
