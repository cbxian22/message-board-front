<template>
  <nav>
    <ul>
      <li>
        <router-link to="/" class="nav-link">
          <img :src="Homeicon" alt="Homeicon" />
        </router-link>
      </li>
      <li>
        <router-link to="/" class="nav-link">
          <img :src="Searchicon" alt="Searchicon" />
        </router-link>
      </li>
      <li>
        <button @click="checkTokenAndOpenModal" class="nav-link">
          <img :src="Addicon" alt="Addicon" />
        </button>
      </li>

      <li>
        <router-link to="/" class="nav-link">
          <img :src="Accounticon" alt="Accounticon" />
        </router-link>
      </li>

      <li v-if="authStore.isLoggedIn" class="nav-link">
        <router-link to="/" @click.prevent="logout" class="nav-link"
          >登出</router-link
        >
      </li>

      <li v-if="authStore.isLoggedIn" class="nav-link">
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
import Homeicon from "../assets/Homeicon.svg";
import Searchicon from "../assets/Searchicon.svg";
import Addicon from "../assets/Addicon.svg";
import Accounticon from "../assets/Accounticon.svg";

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
  display: flex;
  justify-content: center;
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

/* 登入註冊鏈接 */
.register {
  margin-left: auto;
}
</style>
