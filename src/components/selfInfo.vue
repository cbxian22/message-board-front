<!-- homeview -->
<!-- index.js -->
<!-- profile 註解 -->
<!-- navbar 註解 -->
<!-- selfSingleComment  -->

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { NButton, NDrawerContent, NDrawer } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const authStore = useAuthStore();
authStore.checkLoginStatus();

const info = ref([]); // 用來儲存獲取的數據
const name = ref("");
const intro = ref("");
const userAvatar = ref("");
const file = ref(null);
const fileUrl = ref(null);
const fileInputRef = ref(null);

const active = ref(false);
const placement = ref("top");

// 抽屜視窗彈出
const activate = (place) => {
  active.value = true;
  placement.value = place;
};

// 獲取 user 資料
const fetchInfo = async () => {
  const username = router.currentRoute.value.params.username; // 從路由獲取 username
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

const handleUpdate = async () => {
  const username = router.currentRoute.value.params.username;
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (!userId || !token) {
    alert("請先登入！");
    return;
  }
  //   loadingBar.start(); // 驗證通過 且 請求開始前 啟動 Loading

  try {
    const uploadedFileUrl = await uploadFile(); // 獨立處理圖片上傳
    const response = await axios.put(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`,
      { name: name.value, intro: intro.value, fileUrl: uploadedFileUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201) {
      // 發送 WebSocket 訊息
      // socketStore.sendMessage({
      //   content: content.value,
      //   fileUrl: uploadedFileUrl,
      // });

      name.value = "";
      intro.value = "";
      file.value = null;
      fileUrl.value = null;
      fetchInfo();
    } else {
      alert("留言提交失敗");
      //   loadingBar.error();
    }
  } catch (error) {
    console.error("留言提交錯誤:", error);
    alert("留言提交失敗");
  }
  //   finally {
  //     loadingBar.finish();
  //   }
};

// const handleUpdate = async () => {
//   //   const formData = new FormData(); // 創建 FormData 實例
//   //   formData.append("name", name.value); // 如果有其他欄位一併提交
//   //   formData.append("intro", intro.value);
//   //   formData.append("avatar_url", userAvatar.value); // 上傳圖片檔案
//   const username = router.currentRoute.value.params.username;
//   //   try {
//   //     const response = await axios.put(
//   //       `https://message-board-server-7yot.onrender.com/api/users/${info.value.name}`,
//   //       formData,
//   //       { headers: { "Content-Type": "multipart/form-data" } } // 設置適當的 Content-Type
//   //     );
//   try {
//     const response = await axios.put(
//       `https://message-board-server-7yot.onrender.com/api/users/${username}`,
//       {
//         name: name.value,
//         intro: intro.value,
//         avatar_url: userAvatar.value,
//       }
//     );
//     if (response.data.success) {
//       alert("更新成功！");
//       fetchInfo(); // 更新後重新載入資料
//     } else {
//       alert(response.data.message || "更新失敗！");
//     }
//   } catch (error) {
//     console.error("更新時發生錯誤:", error);
//     alert("更新失敗，請稍後再試！");
//   }
// };

onMounted(() => {
  fetchInfo();
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
        <img :src="info.userAvatar" alt="使用者圖片" />
      </div>
    </div>

    <div class="set">
      <n-button @click="activate('top')"> 編輯個人檔案 </n-button>
    </div>
    <!-- <n-drawer v-model:show="active" :width="502" :placement="placement">
      <n-drawer-content title="姓名"> </n-drawer-content>
    </n-drawer> -->
    <n-drawer v-model:show="active" :width="502" :placement="placement">
      <n-drawer-content title="編輯個人檔案">
        <form @submit.prevent="handleUpdate" class="form-container">
          <div class="form-group">
            <label for="userAvatar">更換頭貼</label>
            <input
              type="file"
              ref="fileInputRef"
              @change="handleFileUpload"
              id="userAvatar"
              accept="image/*"
              style="display: none"
            />
            <button
              type="button"
              @click="triggerFileInput"
              class="submit-button"
            >
              按鈕
            </button>
            <!-- 圖片預覽區域 -->
            <div v-if="fileUrl" class="file-preview">
              <img :src="fileUrl" alt="File Preview" class="preview-img" />
              <button @click="cancelFilePreview" class="cancel-preview-button">
                Ｘ
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="name">姓名</label>
            <input
              v-model="name"
              id="name"
              type="text"
              placeholder="請輸入您的姓名"
            />
          </div>

          <div class="form-group">
            <label for="intro">個人介紹</label>
            <textarea
              v-model="intro"
              id="intro"
              placeholder="請輸入您的介紹"
            ></textarea>
          </div>

          <div class="form-group">
            <button type="submit">保存變更</button>
          </div>
        </form>
      </n-drawer-content>
    </n-drawer>
  </div>
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
  border-radius: 50%;
}

.info-box .info-content {
  max-width: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.info-content > .name {
  font-size: 25px !important;
}

.info-content > .intro {
  font-size: 13px !important;
}

.set {
  margin-top: 20px;
}

.set .n-button {
  width: 100%;
  --n-text-color: #fff !important;
  --n-border: 1px solid #fff !important;
}

.set .n-button {
  width: 100%;
  --n-text-color-hover: none !important;
  --n-border-hover: 1px solid #aaa !important;
}

/* ai */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  margin-bottom: 4px;
  font-weight: bold;
}
</style>
