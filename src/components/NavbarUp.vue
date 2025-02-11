<template>
  <nav>
    <ul>
      <li>
        <router-link to="/" class="nav-link">
          <img :src="Homeicon" alt="Homeicon" />
        </router-link>
      </li>

      <li v-if="authStore.isLoggedIn" class="nav-link">
        <router-link to="/" @click.prevent="logout">登出</router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/authStore";
import Homeicon from "../assets/Homeicon.svg";

const authStore = useAuthStore();
authStore.checkLoginStatus();

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* 整體導航條 */
nav {
  display: flex;
  justify-content: center;
  width: 100%;
  border-bottom: 0.5px solid #aaa;
  position: fixed;
  top: 0; /* 固定在視窗底部 */
  left: 0;
  z-index: 1000; /* 確保它不被其他元素遮擋 */
}

/* 項目列表樣式 */
nav ul {
  display: flex;
  justify-content: space-around;
  width: 60%;
}

/* 項目間距 */
nav ul li {
  display: flex;
}

.nav-link {
  display: flex; /* 讓 a 內的內容可以對齊 */
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中（可選） */
  cursor: pointer;
  padding: 10px 25px;
  margin: 5px 0;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(128, 128, 128, 0.15);
}
</style>
