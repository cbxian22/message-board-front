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
              <input id="account" type="text" v-model="account" />
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
            <button
              :class="['btn', 'login-btn']"
              type="submit"
              :disabled="isFormInvalid"
            >
              <n-spin v-if="isTouched" stroke="#FFF" :size="20" />登入
            </button>
          </div>
          <div class="form-group" v-if="errorMessage">
            <span class="error-message">{{ errorMessage }}</span>
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
import { ref, onMounted, computed } from "vue";
import { NSpin, useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/stores/axiosConfig"; // 引入 apiClient

const authStore = useAuthStore();
const router = useRouter();
const message = useMessage();

const role = ref("user");
const account = ref("");
const password = ref("");
const isLoading = ref(true);
const ishowing = ref(false);
const isTouched = ref(false);
const errorMessage = ref("");

const isFormInvalid = computed(() => {
  return !account.value || !password.value;
});

const validateAccount = () => {
  if (/\s/.test(account.value)) {
    errorMessage.value = "請確認帳密碼號格式";
    return false;
  }
  if (account.value.length > 254) {
    errorMessage.value = "請確認帳密碼號格式";
    return false;
  }
  errorMessage.value = "";
  return true;
};

const validatePassword = () => {
  if (/\s/.test(password.value)) {
    errorMessage.value = "請確認帳密碼號格式";
    return false;
  }
  if (password.value.length > 128) {
    errorMessage.value = "請確認帳密碼號格式";
    return false;
  }
  errorMessage.value = "";
  return true;
};

const login = async () => {
  errorMessage.value = "";
  isTouched.value = true; // 發送請求前，顯示 loading 狀態

  if (!validateAccount() || !validatePassword()) {
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
      authStore.login(response.data);
      router.push("/");
    } else {
      message.error("登入失敗！");
      console.log("登入失敗！:", response.data.message);
    }
  } catch (error) {
    console.error("登入時發生錯誤:", error);

    if (error.response) {
      console.log("後端回應:", error.response.data);
      message.error(
        error.response.data.message || "登入失敗，請檢查輸入資訊！"
      );
    } else {
      message.error("無法連線至伺服器，請稍後再試！");
    }
  } finally {
    isTouched.value = false;
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

.login-btn:disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
}

.login-btn:not(:disabled):hover {
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

.error-message {
  color: #ff0000; /* 明確指定紅色 */
  font-size: 12px;
}
</style>
