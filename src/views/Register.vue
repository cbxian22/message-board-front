<template>
  <div class="container-box">
    <div class="container">
      <div class="logo">
        <h1>Boardxian</h1>
      </div>

      <form @submit.prevent="handleRegister" class="form-container">
        <div class="form-group">
          <label
            for="account"
            :class="{ active: account }"
            class="floating-label"
          >
            <input id="account" v-model="account" type="text" required />
            <span>郵件或用戶帳號</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="password"
            :class="{ active: password }"
            class="floating-label"
          >
            <input
              id="password"
              :type="ishowing ? 'text' : 'password'"
              v-model="password"
              required
              @input="checkPasswordInput"
            />
            <span>輸入密碼</span>
            <button
              v-if="password && password.length > 0"
              type="button"
              @click="togglePassword"
              class="toggle-password"
            >
              {{ ishowing ? "隱藏" : "顯示" }}
            </button>
          </label>
        </div>

        <div class="form-group">
          <label for="name" :class="{ active: name }" class="floating-label">
            <input id="name" v-model="name" type="text" required />
            <span>全名</span>
          </label>
        </div>

        <div class="form-group">
          <button class="register-btn" type="submit">
            <n-spin v-if="isTouched" stroke="#FFF" :size="20" />註冊
          </button>
        </div>
      </form>
    </div>

    <div class="container">
      <div class="login">
        <span>已經有帳號嗎？</span>
        <router-link to="/login" class="nav-link">登入</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NSpin } from "naive-ui";
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const router = useRouter();

const role = "user";
const name = ref("");
const account = ref("");
const password = ref("");
const ishowing = ref(false);
const isTouched = ref(false);

const handleRegister = async () => {
  isTouched.value = true;
  try {
    const response = await apiClient.post("/auth/register", {
      name: name.value,
      account: account.value,
      password: password.value,
      role: role,
    });
    if (response.data.success) {
      router.push("/login");
    } else {
      alert(response.data.message || "註冊失敗！");
    }
  } catch (error) {
    console.error("註冊時發生錯誤:", error);
    alert("註冊失敗，請稍後再試！");
  } finally {
    isTouched.value = false;
  }
};

const togglePassword = () => {
  ishowing.value = !ishowing.value;
};
</script>

<style scoped>
.container-box {
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  width: 350px;
  background-color: transparent;
}
.container {
  margin-bottom: 10px;
  padding: 30px 0;
  border: 0.5px solid #aaa;
  border-radius: 2px;
}

.logo {
  padding: 30px 0;
}

.logo h1 {
  text-align: center;
  cursor: default;
}

/* --------- */
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  margin-top: 12px;
  width: 80%;
}

/* 輸入框樣式 */
.floating-label {
  position: relative;
}

.floating-label input {
  width: 100%;
  padding: 10px 0px 8px 10px;
  font-size: 16px;
  border: 0.5px solid #aaa;
  border-radius: 2px;
  transition: border 0.3s;
}

/* 標籤文字 */
.floating-label span {
  padding-bottom: 10px;
  position: absolute;
  left: 10px;
  top: 70%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #aaa;
  transition: all;
  pointer-events: none;
}
/* 使用 Vue class 切換標籤位置 */
.floating-label.active span {
  top: 0px;
  font-size: 12px;
}
.floating-label.active input {
  padding: 16px 0px 2px 10px;
}
/* --------- */

.register-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  padding: 10px;
  background-color: #007bff !important;
  border-radius: 4px;
}

.register-btn:hover {
  background-color: #0095f6 !important;
}

.login {
  text-align: center;
}

.login a {
  color: #007bff;
}

.dark-mode input {
  background: rgb(35, 35, 35);
}

.light-mode input {
  background: rgb(245, 245, 245); /* 半透明黑色背景 */
}

/* 顯示及隱藏的樣式 */
.toggle-password {
  position: absolute;
  right: 0;
  margin-top: 10px;
  margin-right: 10px;
  color: #aaa;
}

.form-group .n-spin-body {
  position: absolute;
  right: 1;
  margin-right: 60px;
}
</style>
