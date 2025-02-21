<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

import selfSingleComment from "../components/selfSingleComment.vue";
import selfInfo from "../components/selfInfo.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";
import Backicon from "../assets/Backicon.svg";

// 計算是否有新留言
// const aru = computed(() => socketStore.messages.length > 0);

const props = defineProps(["username"]);
const router = useRouter();
const route = useRoute(); // 新增 useRoute

watch(
  () => props.username,
  async (newUsername) => {
    if (newUsername) {
      await fetchUserData(newUsername);
    }
  }
);

// 組件掛載時載入資料
onMounted(async () => {
  if (props.username) {
    await fetchUserData(props.username);
  }
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

// 計算是否從 Navbar 跳轉過來
const isFromNavbar = () => {
  return route.query.from === "navbar";
};
</script>

<template>
  <NavbarUp />
  <div class="container-box">
    <div class="back-icon" :class="{ hidden: isFromNavbar() }">
      <router-link to="/">
        <img :src="Backicon" alt="Backicon" />
      </router-link>
    </div>

    <div class="container">
      <selfInfo :username="props.username" />
      <!-- <selfInfo :username="username" :key="username" /> -->
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
      <!-- <selfSingleComment :username="username" :key="username" /> -->
      <selfSingleComment :username="props.username" />
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

.container {
  border: 0.5px solid #373737;
  border-radius: 30px;
  overflow: hidden;
}
</style>
