<template>
  <nav class="navbar">
    <ul>
      <li @click="scrollToTop">
        <router-link to="/" class="nav-link">
          <img class="icon" :src="Homeicon" alt="Homeicon" />
        </router-link>
      </li>

      <li>
        <router-link to="/" class="nav-link">
          <img class="icon" :src="Searchicon" alt="Searchicon" />
        </router-link>
      </li>

      <li>
        <button @click="checkTokenAndOpenModal" class="nav-link">
          <img class="icon" :src="Addicon" alt="Addicon" />
        </button>
      </li>

      <li v-if="!authStore.isLoggedIn">
        <router-link to="/login" class="nav-link">
          <img class="icon" :src="Loginicon" alt="Loginicon" />
        </router-link>
      </li>

      <li v-if="authStore.isLoggedIn">
        <router-link
          :to="{ path: `/@${authStore.userName}`, query: { from: 'navbar' } }"
          class="nav-link"
        >
          <img class="user-img" :src="userAvatar" alt="Accounticon" />
        </router-link>
      </li>
    </ul>
  </nav>

  <!-- 貼文 Modal -->
  <PostView v-model="isPostModalOpen" />

  <!-- 登入 Modal -->
  <Login v-model="isLoginModalOpen" />
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useScrollStore } from "@/stores/scrollStore";

import PostView from "./ModalPost.vue";
import Login from "./ModalLogin.vue";

import Homeicon from "../assets/Homeicon.svg";
import Searchicon from "../assets/Searchicon.svg";
import Addicon from "../assets/Addicon.svg";
import Loginicon from "../assets/Loginicon.svg";

const authStore = useAuthStore();
const scrollStore = useScrollStore();

const isPostModalOpen = ref(false);
const isLoginModalOpen = ref(false);

// 使用 computed 確保獲取最新值
const userAvatar = computed(() => authStore.userAvatar);

const checkTokenAndOpenModal = () => {
  if (!authStore.userId || !authStore.accessToken) {
    isLoginModalOpen.value = true;
  } else {
    isPostModalOpen.value = true;
  }
};

// 重置滾動位置
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
  });
  scrollStore.setScrollPosition(0);
};
</script>

<style scoped>
/* 整體導航條 */
.navbar {
  display: flex;
  justify-content: center;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000;
}

/* 項目列表樣式 */
.navbar ul {
  display: flex;
  justify-content: space-around;
  width: 60%;
}

/* 項目間距 */
.navbar ul li {
  /* display: flex; */
  list-style-type: none;
}

.nav-link {
  display: flex; /* 讓 a 內的內容可以對齊 */
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中（可選） */
  padding: 10px 25px;
  margin: 5px 0;
}

.nav-link:hover {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.user-img {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 50%;
}

/* 淺色下更改引入 icon 顏色 */
/* .light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
} */

.dark-mode nav {
  background: rgba(10, 10, 10, 0.6); /* 半透明黑色背景 */
  backdrop-filter: blur(10px); /* 霧化效果 */
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode nav {
  background: rgba(255, 255, 255, 0.6); /* 半透明黑色背景 */
  backdrop-filter: blur(10px); /* 霧化效果 */
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
