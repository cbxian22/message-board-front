<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router"; // 引入 useRoute;
// import { NSpin } from "naive-ui";
import selfSingleComment from "../components/selfSingleComment.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

const isLoading = ref(true);
const route = useRoute();
const username = computed(() => route.params.username); // 取得路由中的 username 參數

// 當 singleComment 加載完成時，更新 isLoading
// const handleLoaded = () => {
//   isLoading.value = false;
//   console.log("singleComment is loading");
//   console.log(isLoading.value);
// };

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

onMounted(() => {
  console.log("User's username:", username.value); // 顯示當前的 username
});
</script>

<template>
  <!-- <div v-show="isLoading" class="loading-container">
    <n-spin size="large" stroke="#FFF" />
    <div class="n-spin-b">
      <p>produced by</p>
      <p>BoXian</p>
    </div>
  </div>
  <div v-show="!isLoading"> -->
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
      <selfSingleComment />
      <!-- <singleComment @loaded="handleLoaded" /> -->
    </div>
  </div>
  <Navbar />
  <!-- </div> -->
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
