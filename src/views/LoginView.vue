<template>
  <div v-show="isLoading" class="loading-container">
    <n-spin size="large" stroke="#FFF" />
    <div class="n-spin-b">
      <p>produced by</p>
      <p>BoXian</p>
    </div>
  </div>

  <div v-show="!isLoading">
    <div class="container-box">
      <div class="container">
        <div class="logo">
          <h1>Boardxian</h1>
        </div>

        <form @submit.prevent="login" class="form-container">
          <div class="form-group">
            <label
              for="account"
              :class="{ active: account }"
              class="floating-label"
            >
              <input id="account" type="text" v-model="account" required />
              <span>輸入用戶帳號</span>
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
            <button :class="['btn', 'login-btn']" type="submit">
              <n-spin v-if="isTouched" stroke="#FFF" :size="20" />登入
            </button>
          </div>
        </form>
      </div>

      <div class="container">
        <div class="register">
          <span>還沒有帳號嗎？</span>
          <router-link to="/register" class="nav-link">註冊</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NSpin } from "naive-ui";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/stores/axiosConfig"; // 引入 apiClient

const authStore = useAuthStore();
const router = useRouter();

const role = ref("user");
const account = ref("");
const password = ref("");
const isLoading = ref(true);
const ishowing = ref(false);
const isTouched = ref(false);

const login = async () => {
  isTouched.value = true; // 發送請求前，顯示 loading 狀態
  if (!account.value || !password.value) {
    alert("請輸入用戶名和密碼！");
    isTouched.value = false;
    return;
  }

  try {
    const response = await apiClient.post("/auth/login", {
      account: account.value,
      password: password.value,
      role: role.value,
    });

    console.log("後端回應:", response.data);

    if (response.data.success) {
      authStore.login(response.data); // 傳入整個回應物件
      router.push("/");
    } else {
      alert(response.data.message || "登錄失敗，請檢查用戶名或密碼！");
    }
  } catch (error) {
    console.error("登錄錯誤:", error);
    alert("登入失敗，請檢查用戶帳號或密碼！");
  } finally {
    isTouched.value = false; // 無論成功或失敗，最後都應該隱藏 loading
  }
};

const togglePassword = () => {
  ishowing.value = !ishowing.value;
};

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});
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
  outline: none;
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

.login-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  padding: 10px;
  background-color: #007bff !important;
  border-radius: 4px;
}

.login-btn:hover {
  background-color: #0095f6 !important;
}

.register {
  text-align: center;
}

.register a {
  color: #007bff;
}

.dark-mode input {
  background: rgb(35, 35, 35);
}

.light-mode input {
  background: rgb(245, 245, 245);
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
