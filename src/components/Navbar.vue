<template>
  <nav>
    <ul>
      <li><router-link to="/" class="nav-link">首頁</router-link></li>
      <li v-if="!authStore.isLoggedIn">
        <router-link to="/login" class="nav-link">登入</router-link>
      </li>
      <li v-if="!authStore.isLoggedIn" class="register">
        <router-link to="/register" class="nav-link">註冊</router-link>
      </li>
      <li v-if="authStore.isLoggedIn">
        <router-link to="/" @click.native.prevent="logout" class="nav-link"
          >登出</router-link
        >
      </li>
      <li v-if="authStore.isLoggedIn" class="username">
        <h4>Hi {{ authStore.userName }}</h4>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
authStore.checkLoginStatus();

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* 整體導航條 */
nav {
  background-color: #333;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 項目列表樣式 */
nav ul {
  display: flex;
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

/* 項目間距 */
nav ul li {
  margin-right: 20px;
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
  color: white;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-link:hover {
  background-color: #007bff;
  color: #fff;
}

/* 登入註冊鏈接 */
.register {
  margin-left: auto;
}
</style>
