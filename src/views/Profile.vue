<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router"; // 引入 useRoute;

import selfSingleComment from "../components/selfSingleComment.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

const route = useRoute();
// const username = computed(() => route.params.username); // 取得路由中的 username 參數
const username = ref(route.params.username);

watch(
  () => route.params.username,
  (newUsername) => {
    if (newUsername) {
      username.value = newUsername;
      fetchUserData(newUsername);
    }
  }
);

function fetchUserData(username) {
  console.log("重新加載使用者資料:", username);
  // 這裡執行 API 請求，重新獲取該用戶的數據
}
</script>

<template>
  <NavbarUp />
  <div class="container-box">
    <div class="container">
      <!-- selfInfo -->
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
      <selfSingleComment :username="username" />
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
  /* 預留空間，避免被固定的 Navbar 擋住 */
  margin: 100px 0;
}

.container {
  border: 0.5px solid #373737;
  border-radius: 30px;
  overflow: hidden; /* 防止背景超出圓角範圍 */
}
</style>
