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
import { NSpin, useMessage } from "naive-ui";
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const router = useRouter();
const message = useMessage();

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
      message.error("註冊失敗！");
      console.log("註冊失敗！:", response.data.message);
    }
  } catch (error) {
    console.error("註冊時發生錯誤:", error);
    message.error("註冊失敗，請稍後再試！");
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
<!-- 
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
            <span class="error-message" v-if="accountError">{{
              accountError
            }}</span>
            <input
              id="account"
              v-model="account"
              type="text"
              required
              @blur="validateAccount"
              maxlength="254"
            />
            <span>郵件或用戶帳號</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="password"
            :class="{ active: password }"
            class="floating-label"
          >
            <span class="error-message" v-if="passwordError">{{
              passwordError
            }}</span>
            <input
              id="password"
              :type="ishowing ? 'text' : 'password'"
              v-model="password"
              required
              @blur="validatePassword"
              maxlength="128"
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
            <span class="error-message" v-if="nameError">{{ nameError }}</span>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              @blur="validateName"
            />
            <span>全名</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="accountName"
            :class="{ active: accountName }"
            class="floating-label"
          >
            <span class="error-message" v-if="accountNameError">{{
              accountNameError
            }}</span>
            <input
              id="accountName"
              v-model="accountName"
              type="text"
              required
              @blur="validateAccountName"
              maxlength="20"
            />
            <span>用戶名稱</span>
          </label>
        </div>

        <div class="form-group">
          <button
            class="register-btn"
            type="submit"
            :disabled="
              accountError || passwordError || nameError || accountNameError
            "
          >
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
import { NSpin, useMessage } from "naive-ui";
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const router = useRouter();
const message = useMessage();

const role = "user";
const name = ref("");
const account = ref("");
const accountName = ref("");
const password = ref("");
const ishowing = ref(false);
const isTouched = ref(false);
const accountError = ref("");
const passwordError = ref("");
const nameError = ref("");
const accountNameError = ref("");

const validateAccount = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "mail.com",
  ];

  if (!account.value) {
    accountError.value = "請輸入電子郵件";
  } else if (!emailPattern.test(account.value)) {
    accountError.value = "請輸入有效的電子郵件地址";
  } else if (account.value.length > 254) {
    accountError.value = "電子郵件地址不得超過254個字符";
  } else {
    const domain = account.value.split("@")[1].toLowerCase();
    if (!validDomains.includes(domain)) {
      accountError.value =
        "請使用支援的電子郵件服務 (Gmail, Yahoo, Hotmail 等)";
    } else {
      accountError.value = "";
    }
  }
};

const validatePassword = () => {
  const hasUpperCase = /[A-Z]/.test(password.value);
  const hasNumber = /\d/.test(password.value);

  if (!password.value) {
    passwordError.value = "請輸入密碼";
  } else if (password.value.length < 8) {
    passwordError.value = "密碼需至少8個字符";
  } else if (password.value.length > 128) {
    passwordError.value = "密碼不得超過128個字符";
  } else if (!hasUpperCase) {
    passwordError.value = "密碼需包含至少一個大寫字母";
  } else if (!hasNumber) {
    passwordError.value = "密碼需包含至少一個數字";
  } else {
    passwordError.value = "";
  }
};

const validateName = () => {
  if (!name.value) {
    nameError.value = "請輸入全名";
  } else if (name.value.length < 2) {
    nameError.value = "全名需至少2個字符";
  } else if (name.value.length > 50) {
    nameError.value = "全名不得超過50個字符";
  } else {
    nameError.value = "";
  }
};

const validateAccountName = () => {
  const validPattern = /^[a-z0-9._]+$/;
  if (!accountName.value) {
    accountNameError.value = "請輸入用戶名稱";
  } else if (!validPattern.test(accountName.value)) {
    accountNameError.value = "只能使用小寫英文、數字、點(.)和下劃線(_)";
  } else if (accountName.value.length < 3) {
    accountNameError.value = "用戶名稱需至少3個字符";
  } else if (accountName.value.length > 20) {
    accountNameError.value = "用戶名稱最多20個字符";
  } else {
    accountNameError.value = "";
  }
};

const handleRegister = async () => {
  validateAccount();
  validatePassword();
  validateName();
  validateAccountName();

  if (
    accountError.value ||
    passwordError.value ||
    nameError.value ||
    accountNameError.value
  ) {
    return;
  }

  isTouched.value = true;
  try {
    const response = await apiClient.post("/auth/register", {
      name: name.value,
      account: account.value,
      accountName: accountName.value,
      password: password.value,
      role: role,
    });
    if (response.data.success) {
      router.push("/login");
    } else {
      message.error("註冊失敗！");
      console.log("註冊失敗！:", response.data.message);
    }
  } catch (error) {
    console.error("註冊時發生錯誤:", error);
    message.error("註冊失敗，請稍後再試！");
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

.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  margin-top: 12px;
  width: 80%;
}

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

.floating-label.active span {
  top: 0px;
  font-size: 12px;
}

.floating-label.active input {
  padding: 16px 0px 2px 10px;
}

.error-message {
  position: absolute;
  top: -18px; /* 調整位置避免重疊 */
  left: 0;
  color: #ff0000; /* 明確指定紅色 */
  font-size: 12px;
  z-index: 1; /* 確保在浮動標籤上方 */
}

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

.register-btn:disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
}

.register-btn:hover:not(:disabled) {
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
  background: rgb(245, 245, 245);
}

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
</style> -->
