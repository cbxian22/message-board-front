<template>
  <div class="container-box">
    <div class="container">
      <div class="logo">
        <h1>Boardxian</h1>
      </div>

      <form @submit.prevent="handleRegister" class="form-container">
        <div class="form-group">
          <label for="name" :class="{ active: name }" class="floating-label">
            <input id="name" v-model="name" type="text" required />
            <span>用戶名稱</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="username"
            :class="{ active: username }"
            class="floating-label"
          >
            <input id="username" v-model="username" type="text" required />
            <span>用戶帳號</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="password"
            :class="{ active: password }"
            class="floating-label"
          >
            <input id="password" v-model="password" type="password" required />
            <span>用戶密碼</span>
          </label>
        </div>

        <div class="form-group">
          <button type="submit">註冊</button>
        </div>
      </form>
    </div>

    <div class="container">
      <div class="login">
        <span>還沒有帳號嗎？</span>
        <router-link to="/login" class="nav-link">登入</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const name = ref("");
const username = ref("");
const password = ref("");
const role = "user"; // 固定角色為 user
const router = useRouter();

const handleRegister = async () => {
  try {
    const response = await axios.post(
      "https://message-board-server-7yot.onrender.com/api/register",
      // "http://localhost:3000/api/register",
      {
        name: name.value,
        username: username.value,
        password: password.value,
        role: role, // 固定傳遞角色
      }
    );
    if (response.data.success) {
      // alert("註冊成功！");
      router.push("/login"); // 註冊成功後跳轉到登入頁面
    } else {
      alert(response.data.message || "註冊失敗！");
    }
  } catch (error) {
    console.error("註冊時發生錯誤:", error);
    alert("註冊失敗，請稍後再試！");
  }
};
</script>

<style scoped>
.container-box {
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  width: 350px;
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
  color: #fff;
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
  background: none;
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

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #007bff;
}

.login {
  text-align: center;
}

.login a {
  text-decoration: none;
  color: #0056b3;
}
</style>
