<!-- <template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay">
      <button class="close-btn" @click="closeModal">✖</button>
      <div class="modal-content">
        <div class="logo">
          <h1>Boardxian</h1>
        </div>

        <div class="register">
          <span>還沒有帳號嗎？</span>
          <router-link to="/register" class="nav-link">註冊</router-link>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const closeModal = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 350px;
  text-align: center;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.logo {
  padding: 10px 0;
}

.logo h1 {
  text-align: center;
  color: black;
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
  padding: 10px 8px;
  font-size: 16px;
  border: 1px solid #aaa;
  border-radius: 2px;
  outline: none;
  transition: border 0.3s;
}

.floating-label span {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #aaa;
  transition: all 0.3s;
}

.floating-label.active span {
  top: 0px;
  font-size: 12px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

button:hover {
  background-color: #0056b3;
}

.register {
  margin-top: 10px;
}

.register a {
  text-decoration: none;
  color: #0056b3;
}
</style> -->

<!-- <template>
  <div class="message-container">
    <h1>我要貼文</h1>
    <form @submit.prevent="handleMessage" class="message-form">
      <div class="form-group">
        <label for="messagetitle">主題:</label>
        <input
          id="messagetitle"
          v-model="messagetitle"
          type="text"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="content">內容:</label>
        <textarea
          id="content"
          v-model="content"
          required
          class="form-textarea"
        ></textarea>
      </div>

      <button type="submit" class="submit-btn">送出</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "../stores/axiosConfig"; // 引入统一配置后的 axios
import { useRouter } from "vue-router";
import { useSocketStore } from "../stores/socketStore"; // 引入 WebSocket Store
const router = useRouter();
const messagetitle = ref("");
const content = ref("");

// 使用 Pinia Store 發送 WebSocket 訊息
const socketStore = useSocketStore();

const handleMessage = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  try {
    // 使用 userId 構建正确的 API 路徑
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/posts/${userId}`,
      // `http://localhost:3000/api/posts/${userId}`,
      {
        title: messagetitle.value,
        content: content.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 將 Token 添加到請求頭中
        },
      }
    );

    // 根據後端響應，而繼續
    if (response.status === 201) {
      // 發送 WebSocket 訊息
      socketStore.sendMessage({
        title: messagetitle.value,
        content: content.value,
      });

      // alert("留言成功！");
      messagetitle.value = "";
      content.value = "";

      router.push("/");
    } else {
      alert("留言提交失敗");
    }
  } catch (error) {
    console.error("留言提交錯誤::", error);
    alert("留言提交失敗");
  }
};
</script>

<style scoped>
.message-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 0; /* 去掉圓角 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  font-family: "Arial", sans-serif;
  color: #333;
}

.message-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: bold;
  color: #555;
}

.form-input,
.form-textarea {
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 0; /* 去掉圓角 */
}

.form-input:focus,
.form-textarea:focus {
  border-color: #007bff;
  outline: none;
}

.form-textarea {
  resize: vertical;
  min-height: 150px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0; /* 去掉圓角 */
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #0056b3;
}
</style> -->

<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <div class="container">
      <div class="logo">
        <h1>Boardxian</h1>
      </div>

      <div class="content">
        <h2>註冊即可與好友聯繫</h2>
        <p>加入 Boardxian 即可與大家互動。</p>
      </div>

      <div class="link">
        <router-link to="/login" class="nav-link"
          >使用 Boardxian 帳號繼續</router-link
        >
      </div>
    </div>
  </Modal>
</template>

<script setup>
import Modal from "./Modal.vue"; // 引入彈窗組件
import LoginView from "@/views/LoginView.vue";
const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped>
.container {
  padding: 30px;
  background: rgb(16, 16, 16);
  border-radius: 2px;
  text-align: center;
}

.container * {
  background: transparent;
  padding: 10px 0;
}
.content * {
  color: #aaa;
}
.link {
  margin: 10px 0;
  height: auto;
}

.nav-link {
  height: 100%;
  border: 0.5px solid #aaa;
  text-decoration: none;
  font-size: 1rem;
  padding: 15px 25px;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
