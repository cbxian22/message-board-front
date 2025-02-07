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
  </Modal>
</template>

<script setup>
import Modal from "./Modal.vue"; // 引入彈窗組件
import { ref } from "vue";
import axios from "../stores/axiosConfig"; // 統一配置後的 axios
import { useSocketStore } from "../stores/socketStore"; // WebSocket Store

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const messagetitle = ref("");
const content = ref("");

const socketStore = useSocketStore();

const handleMessage = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    alert("請先登入！");
    return;
  }

  try {
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/posts/${userId}`,
      { title: messagetitle.value, content: content.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201) {
      // 發送 WebSocket 訊息
      socketStore.sendMessage({
        title: messagetitle.value,
        content: content.value,
      });

      // 清空輸入欄
      messagetitle.value = "";
      content.value = "";

      // 關閉 Modal
      emit("update:modelValue", false);
    } else {
      alert("留言提交失敗");
    }
  } catch (error) {
    console.error("留言提交錯誤:", error);
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
  border-radius: 8px;
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
  border-radius: 4px;
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
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #0056b3;
}
</style>
