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
        <SinglePosts @loaded="handleLoaded" />
      </div>
    </div>
    <Navbar />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from "vue";
import { useScrollStore } from "@/stores/scrollStore";
import { useSocketStore } from "../stores/socketStore";
import { NSpin } from "naive-ui";

import Navbar from "../components/Navbar.vue";
import SinglePosts from "../components/SinglePosts.vue";
import NavbarUp from "../components/NavbarUp.vue";

const scrollStore = useScrollStore();
const socketStore = useSocketStore();
const isLoading = ref(true);

const saveScrollPosition = () => {
  scrollStore.setScrollPosition(window.scrollY);
};

onMounted(() => {
  // 監聽滾動事件，記錄滾動位置
  window.addEventListener("scroll", saveScrollPosition);

  // 回到先前儲存的位置
  nextTick(() => {
    window.scrollTo(0, scrollStore.getScrollPosition());
  });
});

onUnmounted(() => {
  // 離開頁面時移除事件監聽
  window.removeEventListener("scroll", saveScrollPosition);
});

// 當 singleComment 加載完成時，更新 isLoading
const handleLoaded = () => {
  isLoading.value = false;
};

// 計算是否有新留言
const aru = computed(() => socketStore.messages.length > 0);
</script>

<style scoped>
/* 安插 singleComment 容器 */
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin: 100px 0;
}

.aru {
  border-bottom: 1px solid black;
  padding: 20px 0 20px 0;
}
</style>
