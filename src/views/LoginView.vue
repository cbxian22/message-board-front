<template>
  <div class="login-container">
    <div class="logo">
      <h1>留言板</h1>
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
        <label :class="{ active: username }" class="floating-label">
          <input id="username" type="text" v-model="username" required />
          <span>輸入用戶帳號</span>
        </label>
      </div>

      <div class="form-group">
        <label :class="{ active: password }" class="floating-label">
          <input id="password" type="password" v-model="password" required />
          <span>輸入密碼</span>
        </label>
      </div>
      <div class="form-group">
        <button type="submit" class="btn">登入</button>
      </div>
    </form>
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
      router.push("/");
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
.login-container {
  width: 350px;
  padding: 20px 0;
  border: 1px solid #ccc;
  border-radius: 2px;
  background-color: black;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.logo {
  padding: 20px 0;
}

.logo h1 {
  text-align: center;
  color: #fff;
}

/* --------- */
.form-container {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin: 10px 0 0 0;
  width: 80%;
  align-self: center;
}

/* 輸入框樣式 */
.floating-label {
  position: relative;
}

.floating-label input {
  width: 100%;
  background-color: black;
  color: #fff;
  padding: 10px 10px 5px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 2px;
  outline: none;
  transition: border 0.3s;
}

/* 標籤文字 */
.floating-label span {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #999;
  transition: all 0.3s ease-in-out;
  pointer-events: none;
}
/* 使用 Vue class 切換標籤位置 */
.floating-label.active span {
  top: 0px;
  font-size: 12px;
}
/* --------- */

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
