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
        <!-- <singleComment /> -->
        <SinglePosts @loaded="handleLoaded" />
      </div>
    </div>
    <Navbar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useSocketStore } from "../stores/socketStore";
import { useScrollStore } from "@/stores/scrollStore";
import { NSpin } from "naive-ui";

import Navbar from "../components/Navbar.vue";
import SinglePosts from "../components/SinglePosts.vue";
import NavbarUp from "../components/NavbarUp.vue";

const socketStore = useSocketStore();
const scrollStore = useScrollStore();

const isLoading = ref(true);

// 監聽滾動，記錄滾動位置
const saveScrollPosition = () => {
  scrollStore.setScrollPosition(window.scrollY);
};

onMounted(() => {
  nextTick(() => {
    window.scrollTo(0, scrollStore.getScrollPosition());
  });
  window.addEventListener("scroll", saveScrollPosition);
});

onUnmounted(() => {
  window.removeEventListener("scroll", saveScrollPosition);
});

// 當 singleComment 加載完成時，更新 isLoading
const handleLoaded = () => {
  isLoading.value = false;
  nextTick(() => {
    window.scrollTo(0, scrollStore.getScrollPosition());
  });
};

// 計算是否有新留言
// const aru = computed(() => socketStore.messages.length > 0);
</script>

<style scoped>
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
