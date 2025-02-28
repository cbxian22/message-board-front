<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import {
  NSwitch,
  NButton,
  NDrawerContent,
  NDrawer,
  useLoadingBar,
  useMessage,
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
const message = useMessage();

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
const friendRequestSent = ref(false);
const isPendingReceived = ref(false);
const isAlreadyFriend = ref(false);
const pendingRequestId = ref(null);

// 監聽 authStore.userName 的變化並同步 loggedInUser
watch(
  () => authStore.userName,
  (newName) => {
    loggedInUser.value = newName;
  }
);

watch(
  () => props.userData,
  (newData) => {
    if (newData) {
      info.value = {
        ...newData,
        is_private: Boolean(newData.is_private),
      };
      console.log("Updated info.value:", info.value);
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
  }
});

// 檢查好友狀態
const checkFriendRequestStatus = async () => {
  if (!authStore.accessToken || !info.value.id) return;

  try {
    const response = await apiClient.get(`/friends/status/${info.value.id}`);
    const { status, isSender } = response.data;

    if (status === "pending" && isSender) {
      friendRequestSent.value = true;
      isPendingReceived.value = false;
      isAlreadyFriend.value = false;
      pendingRequestId.value = null; // 發送者不需要 requestId
    } else if (status === "pending" && !isSender) {
      friendRequestSent.value = false;
      isPendingReceived.value = true;
      isAlreadyFriend.value = false;
      // 獲取 requestId
      const pendingResponse = await apiClient.get(
        `/friends/pending/${info.value.id}`
      );
      pendingRequestId.value = pendingResponse.data.requestId;
    } else if (status === "accepted") {
      friendRequestSent.value = false;
      isPendingReceived.value = false;
      isAlreadyFriend.value = true;
      pendingRequestId.value = null;
    } else {
      friendRequestSent.value = false;
      isPendingReceived.value = false;
      isAlreadyFriend.value = false;
      pendingRequestId.value = null;
    }
  } catch (error) {
    console.error("檢查好友狀態失敗:", error);
    friendRequestSent.value = false;
    isPendingReceived.value = false;
    isAlreadyFriend.value = false;
    pendingRequestId.value = null;
  }
};

// 發送好友請求
const sendFriendRequest = async () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
    return;
  }

  const friendId = info.value.id;
  if (!friendId) {
    message.error("無法獲取目標用戶 ID！");
    return;
  }

  loadingBar.start();
  try {
    const response = await apiClient.post("/friends/request", { friendId });

    if (response.status === 201) {
      friendRequestSent.value = true;
      isPendingReceived.value = false;
      isAlreadyFriend.value = false;
      pendingRequestId.value = null;
      message.success("好友請求已發送！");
    } else if (response.status === 200) {
      friendRequestSent.value = false;
      isPendingReceived.value = false;
      isAlreadyFriend.value = false;
      pendingRequestId.value = null;
      message.success("已取消好友請求！");
    }
  } catch (error) {
    console.error("操作失敗:", error);
    if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else if (error.response?.status === 400) {
      message.error("已存在好友關係，無法操作！");
      friendRequestSent.value = false;
      isAlreadyFriend.value = true;
    } else if (error.response?.status === 404) {
      message.error("用戶不存在！");
    } else {
      message.error("操作失敗，請稍後再試！");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

// 接受好友請求（需要知道 requestId）
const acceptFriendRequest = async () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
    return;
  }

  if (!pendingRequestId.value) {
    message.error("無待接受的好友請求！");
    return;
  }

  loadingBar.start();
  try {
    const response = await apiClient.put(
      `/friends/accept/${pendingRequestId.value}`
    );
    if (response.status === 200) {
      isPendingReceived.value = false;
      friendRequestSent.value = false;
      isAlreadyFriend.value = true;
      pendingRequestId.value = null;
      message.success("已接受好友請求！");
    }
  } catch (error) {
    console.error("接受好友請求失敗:", error);
    if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else if (error.response?.status === 404) {
      message.error("好友請求不存在！");
    } else if (error.response?.status === 403) {
      message.error("無權限接受此請求！");
    } else {
      message.error("接受失敗，請稍後再試！");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

// 拒絕好友請求
const rejectFriendRequest = async () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
    return;
  }

  if (!pendingRequestId.value) {
    message.error("無待拒絕的好友請求！");
    return;
  }

  loadingBar.start();
  try {
    const response = await apiClient.put(
      `/friends/reject/${pendingRequestId.value}`
    );
    if (response.status === 200) {
      isPendingReceived.value = false;
      friendRequestSent.value = false;
      isAlreadyFriend.value = false;
      pendingRequestId.value = null;
      message.success("已拒絕好友請求！");
    }
  } catch (error) {
    console.error("拒絕好友請求失敗:", error);
    if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else if (error.response?.status === 404) {
      message.error("好友請求不存在！");
    } else if (error.response?.status === 403) {
      message.error("無權限拒絕此請求！");
    } else {
      message.error("拒絕失敗，請稍後再試！");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

// 解除好友
const deleteFriend = async () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
    return;
  }

  const friendId = info.value.id;
  loadingBar.start();
  try {
    const response = await apiClient.delete(`/friends/${friendId}`);
    if (response.status === 200) {
      isAlreadyFriend.value = false;
      friendRequestSent.value = false;
      isPendingReceived.value = false;
      pendingRequestId.value = null;
      message.success("已解除好友！");
    }
  } catch (error) {
    console.error("解除好友失敗:", error);
    if (error.response?.status === 404) {
      message.error("好友關係不存在！");
    } else if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else {
      message.error("解除好友失敗，請稍後再試！");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

// 檢查登入並處理好友請求
const checkTokenAndOpenModal = () => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
  } else {
    sendFriendRequest();
  }
};

// 初始化檢查登入狀態，並監聽 authStore 變化
onMounted(() => {
  updateWidth();
  window.addEventListener("resize", updateWidth);
  checkFriendRequestStatus();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});

watch(
  () => info.value.id,
  () => {
    checkFriendRequestStatus();
  }
);

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

// 計算是否有變更
const hasChanges = computed(() => {
  return (
    name.value !== info.value.name ||
    intro.value !== info.value.intro ||
    tempAvatar.value !== info.value.userAvatar ||
    is_private.value !== info.value.is_private
  );
});

// 提交更新
const handleUpdate = async () => {
  if (!hasChanges.value) {
    show.value = false;
    return;
  }

  if (info.value.name !== authStore.userName) {
    message.error("您只能編輯自己的資料！");
    show.value = false;
    return;
  }

  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
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
      message.success("更新成功！");
    } else {
      message.error("更新失敗！");
      loadingBar.error();
    }
  } catch (error) {
    console.error("更新錯誤:", error);
    if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else {
      message.error("更新失敗，請稍後再試！");
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
    message.error("您只能刪除自己的資料！");
    show.value = false;
    return;
  }

  if (!authStore.userId || !authStore.accessToken) {
    message.error("請先登入！");
    isLoginModalOpen.value = true;
    return;
  }

  loadingBar.start();

  try {
    const response = await apiClient.delete("/users/profile");
    if (response.status === 200) {
      authStore.logout();
      show.value = false;
      message.success("已刪除成功！");
      window.location.href = "/";
    } else {
      throw new Error("刪除失敗");
    }
  } catch (error) {
    console.error("刪除失敗:", error);
    message.success("刪除失敗！");
    loadingBar.error();
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

    <div class="set-btn" v-if="loggedInUser !== info.name">
      <n-button v-if="isAlreadyFriend" @click="deleteFriend">解除好友</n-button>
      <div v-else-if="isPendingReceived" class="friend-request-actions">
        <n-button @click="acceptFriendRequest">確認好友請求</n-button>
        <n-button @click="rejectFriendRequest">拒絕好友請求</n-button>
      </div>
      <n-button v-else @click="checkTokenAndOpenModal">
        {{ friendRequestSent ? "取消好友請求" : "加入好友" }}
      </n-button>
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
              <n-button @click="handleUpdate">{{
                hasChanges ? "保存變更" : "取消變更"
              }}</n-button>
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

/* 並排 */
.friend-request-actions {
  display: flex;
  gap: 10px;
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
