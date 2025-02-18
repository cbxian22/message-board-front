<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router"; // 引入 useRoute;
import axios from "axios";

import selfSingleComment from "../components/selfSingleComment.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

const router = useRouter();
const route = useRoute();
const username = route.params.username;

onMounted(async () => {
  try {
    const response = await axios.get(
      `https://message-board-server-7yot.onrender.com/api/users/${username}`
    );
    if (response.data.message === "使用者不存在") {
      router.replace("/not-found");
      return;
    }
  } catch (error) {
    console.error("查詢用戶錯誤:", error);

    router.replace("/not-found");
  }
});
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
