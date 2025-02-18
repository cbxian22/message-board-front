<template>
  <div v-show="isLoading" class="loading-container">
    <n-spin size="large" stroke="#FFF" />
    <div class="n-spin-b">
      <p>produced by</p>
      <p>BoXian</p>
    </div>
  </div>

  <div v-show="!isLoading">
    <NavbarUp />
    <div class="container-box">
      <div class="container">
        <!--  -->
        <div v-if="aru" class="aru">
          <h1>最新留言</h1>
          <div
            v-for="(message, index) in socketStore.messages"
            :key="index"
            class="comment"
          >
            <!-- <h3 class="comment-title">{{ message.data.title }}</h3> -->
            <p class="comment-content">{{ message.data.content }}</p>

            <!-- <div class="comment-meta">
              <span class="comment-author">貼文者: {{ comment.name }}</span>
              <span class="comment-time"
                >貼文時間: {{ formatDate(comment.timestamp) }}</span
              >
            </div>
            <p v-if="comment.file_url" class="comment-file">
              附件: <a :href="comment.file_url" target="_blank">下載</a>
            </p>
            <button @click="goToCommentPage(comment.id)" class="view-button">
              查看及回覆
            </button> -->
            <!--  -->
          </div>
        </div>
        <!--  -->
        <!-- <singleComment /> -->
        <singleComment @loaded="handleLoaded" />
      </div>
    </div>
    <Navbar />
  </div>
</template>

<script setup>
import { computed, onUpdated, ref, onMounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useScrollStore } from "@/stores/scrollStore";
import { NSpin } from "naive-ui";

import { useSocketStore } from "../stores/socketStore";
import singleComment from "../components/singleComment.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

const socketStore = useSocketStore();
const scrollStore = useScrollStore();
const isLoading = ref(true);

// 當 singleComment 加載完成時，更新 isLoading
// const handleLoaded = () => {
//   isLoading.value = false;
// };

// 在離開頁面之前保存滾動位置
onBeforeRouteLeave((to, from, next) => {
  console.log("Saving scroll position:", window.scrollY);
  scrollStore.setScrollPosition(window.scrollY);
  next();
});

onUpdated(() => {
  const position = useScrollStore().getScrollPosition();
  if (position !== 0) {
    window.scrollTo(0, position);
  }
});

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);

onMounted(() => {
  const handleLoaded = () => {
    isLoading.value = false;
  };
  handleLoaded();
});
</script>

<style scoped>
/* 安插 singleComment 容器 */
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

.aru {
  border-bottom: 1px solid black;
  padding: 20px 0 20px 0;
}
</style>
