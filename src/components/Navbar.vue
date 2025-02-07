<template>
  <nav>
    <ul>
      <li><router-link to="/" class="nav-link">首頁</router-link></li>

      <li>
        <button @click="checkTokenAndOpenModal" class="nav-link">+</button>
      </li>

      <li v-if="authStore.isLoggedIn">
        <router-link to="/" @click.prevent="logout" class="nav-link"
          >登出</router-link
        >
      </li>

      <li v-if="authStore.isLoggedIn" class="username">
        <h4>Hi {{ authStore.userName }}</h4>
      </li>
    </ul>
  </nav>

  <!-- 貼文 Modal -->
  <Message v-model="isPostModalOpen" />

  <!-- 登入 Modal -->
  <Login v-model="isLoginModalOpen" />
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/authStore";
import Message from "../components/MessageView.vue";
import Login from "../components/LoginModal.vue";

const authStore = useAuthStore();
authStore.checkLoginStatus();

const isPostModalOpen = ref(false);
const isLoginModalOpen = ref(false);

const logout = () => {
  authStore.logout();
};

const checkTokenAndOpenModal = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    isLoginModalOpen.value = true;
  } else {
    isPostModalOpen.value = true;
  }
};
</script>

<style scoped>
/* 整體導航條 */
nav {
  width: 100%;
  border-top: 0.5px solid #aaa;
  position: fixed;
  bottom: 0; /* 固定在視窗底部 */
  left: 0;
  z-index: 1000; /* 確保它不被其他元素遮擋 */
}

/* 項目列表樣式 */
nav ul {
  display: flex;
  justify-content: center;
  list-style-type: none;
}

/* 項目間距 */
nav ul li {
  display: flex;
}

/* 用戶名顯示 */
.username {
  margin-left: auto;
  color: white;
  font-size: 1rem;
  cursor: default;
}

/* 頁面鏈接 */
.nav-link {
  text-decoration: none;
  font-size: 1rem;
  padding: 15px 25px;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(128, 128, 128, 0.15);
}

/* 登入註冊鏈接 */
.register {
  margin-left: auto;
}
</style>
