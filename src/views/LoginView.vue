<template>
  <div class="container-box">
    <div class="container">
      <div class="logo">
        <h1>Boardxian</h1>
      </div>

      <form @submit.prevent="login" class="form-container">
        <!-- <div class="form-group">
        <label for="role">角色</label>
        <select id="role" v-model="role" required>
          <option value="user">使用者</option>
          <option value="admin">管理員</option>
        </select>
      </div> -->

        <div class="form-group">
          <label
            for="username"
            :class="{ active: username }"
            class="floating-label"
          >
            <input id="username" type="text" v-model="username" required />
            <span>輸入用戶帳號</span>
          </label>
        </div>

        <div class="form-group">
          <label
            for="password"
            :class="{ active: password }"
            class="floating-label"
          >
            <input id="password" type="password" v-model="password" required />
            <span>輸入密碼</span>
          </label>
        </div>
        <div class="form-group">
          <button type="submit" class="btn">登入</button>
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
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const username = ref("");
const password = ref("");
const role = ref("user");
const authStore = useAuthStore();

const login = async () => {
  if (!username.value || !password.value) {
    alert("請輸入用戶名和密碼！");
    return;
  }

  try {
    const response = await axios.post(
      "https://message-board-server-7yot.onrender.com/api/login",
      // "http://localhost:3000/api/login",
      {
        username: username.value,
        password: password.value,
        role: role.value,
      }
    );

    console.log(response.data); // 獲取後端響應(含生成令牌token)

    if (response.data.success) {
      const { token, userId } = response.data; // 儲存 token 和 userId
      authStore.login(token, userId); // 儲存進 pinia
      // router.push("/");
    } else {
      alert(response.data.message || "登錄失敗，請檢查用戶名或密碼！");
    }
  } catch (error) {
    console.error("登錄錯誤:", error);
    alert("登入失敗，請檢查用戶帳號或密碼！");
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

.register {
  text-align: center;
}

.register a {
  text-decoration: none;
  color: #0056b3;
}
</style>
