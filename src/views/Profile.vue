<script setup>
import { ref, computed, onMounted, watch, nextTick, onUpdated } from "vue";
import { useRoute, useRouter } from "vue-router"; // 引入 useRoute;
import axios from "axios";

import selfSingleComment from "../components/selfSingleComment.vue";
import selfInfo from "../components/selfInfo.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";
import Backicon from "../assets/Backicon.svg";

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

const router = useRouter();
const route = useRoute();
const username = ref(route.params.username); // 使用 ref 存儲 username

// 監控 route.params.username 變化，並手動重新獲取資料
watch(
  () => route.params.username,
  async (newUsername) => {
    username.value = newUsername; // 更新 username
    await fetchUserData(username.value); // 重新加載資料
    nextTick(() => {
      console.log("route 參數更新後，username 是：", username.value);
    });
  },
  { immediate: true } // 初次加載時也觸發
);

// 初始載入時獲取資料
onMounted(async () => {
  await fetchUserData(username.value);
});

// 每次組件更新後觸發的操作
onUpdated(() => {
  console.log("組件已更新！當前的 username 是：", username.value);
});

// 獲取使用者資料
const fetchUserData = async (username) => {
  try {
    const response = await axios.get(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`
    );
    if (response.data.message === "使用者不存在") {
      router.replace("/not-found");
    }
  } catch (error) {
    console.error("查詢用戶錯誤:", error);
    router.replace("/not-found");
  }
};
</script>

<template>
  <NavbarUp />
  <div class="container-box">
    <div class="back-icon">
      <router-link to="/">
        <img :src="Backicon" alt="Backicon" />
      </router-link>
    </div>

    <div class="container">
      <selfInfo :username="username" :key="username" />
      <!-- <div v-if="aru" class="aru">
        <h1>最新留言</h1>
        <div
          v-for="(message, index) in socketStore.messages"
          :key="index"
          class="comment"
        >
          <p class="comment-content">{{ message.data.content }}</p>
        </div>
      </div> -->
      <selfSingleComment :username="username" :key="username" />
    </div>
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

.back-icon a {
  display: flex;
}

/* 淺色下更改引入 icon 顏色 */
.light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
}

.container {
  border: 0.5px solid #373737;
  border-radius: 30px;
  overflow: hidden;
}
</style>
