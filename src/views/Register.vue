<template>
  <div class="register-container">
    <h1>留言板</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="name">暱稱:</label>
        <input
          id="name"
          v-model="name"
          placeholder="輸入暱稱"
          type="text"
          required
        />
      </div>
      <div class="form-group">
        <label for="username">用戶帳號:</label>
        <input
          id="username"
          v-model="username"
          placeholder="輸入用戶帳號"
          type="text"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密碼:</label>
        <input
          id="password"
          v-model="password"
          placeholder="密碼"
          type="password"
          required
        />
      </div>
      <button type="submit">註冊</button>
    </form>
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
.register-container {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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

input {
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
