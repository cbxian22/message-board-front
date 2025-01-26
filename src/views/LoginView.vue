<template>
  <div class="login-container">
    <h1>留言板</h1>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="role">角色</label>
        <select id="role" v-model="role" required>
          <option value="user">使用者</option>
          <option value="admin">管理員</option>
        </select>
      </div>

      <div class="form-group">
        <label for="username">用戶帳號:</label>
        <input
          id="username"
          type="text"
          v-model="username"
          placeholder="輸入用戶帳號"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">密碼</label>
        <input
          id="password"
          type="password"
          v-model="password"
          placeholder="輸入密碼"
          required
        />
      </div>

      <button type="submit" class="btn">登入</button>
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
  max-width: 400px;
  width: 100%; /* 確保容器的寬度為 100% */
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;

  /* 使用絕對定位將容器置中 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 確保元素的中心點與視窗中心對齊 */
}

h1 {
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
select {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

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
