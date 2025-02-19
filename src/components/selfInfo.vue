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

const active = ref(false);
const placement = ref("top");

const activate = (place) => {
  active.value = true;
  placement.value = place;
};

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

// const info = ref({
//   id: 1,
//   name: "小明",
//   intro: "這是第一個留言的內容，討論一些有趣的話題。",
//   userAvatar:
//     "https://storage.googleapis.com/message_board_storage/default_profile.jpg",
// });

const handleUpdate = async () => {
  //   const formData = new FormData(); // 創建 FormData 實例
  //   formData.append("name", name.value); // 如果有其他欄位一併提交
  //   formData.append("intro", intro.value);
  //   formData.append("avatar_url", userAvatar.value); // 上傳圖片檔案
  const username = router.currentRoute.value.params.username;
  //   try {
  //     const response = await axios.put(
  //       `https://message-board-server-7yot.onrender.com/api/users/${info.value.name}`,
  //       formData,
  //       { headers: { "Content-Type": "multipart/form-data" } } // 設置適當的 Content-Type
  //     );
  try {
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`,
      {
        name: name.value,
        intro: intro.value,
        avatar_url: userAvatar.value,
      }
    );
    if (response.data.success) {
      alert("更新成功！");
      fetchInfo(); // 更新後重新載入資料
    } else {
      alert(response.data.message || "更新失敗！");
    }
  } catch (error) {
    console.error("更新時發生錯誤:", error);
    alert("更新失敗，請稍後再試！");
  }
};

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
    <!-- <div v-if="username" class="set">編輯個人檔案</div> -->
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
            <label for="avatar">更換頭貼</label>
            <input type="file" id="avatar" accept="image/*" />
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
