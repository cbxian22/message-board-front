<template>
  <div class="admin">
    <h1>Admin Panel</h1>
    <div v-if="messages.length > 0">
      <div v-for="message in messages" :key="message.id">
        <!-- <h3>{{ message.title }}</h3> -->
        <p>{{ message.content }}</p>
        <button @click="editMessage(message.id)">Edit</button>
        <button @click="deleteMessage(message.id)">Delete</button>
      </div>
    </div>
    <div v-else>
      <p>No messages to manage!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios"; // 引入 axios

const messages = ref([]);

const fetchMessages = async () => {
  try {
    // const response = await axios.get("http://localhost:3000/api/messages");
    const response = await axios.get(
      "https://message-board-server-7yot.onrender.com/api/messages"
    );
    messages.value = response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};

const deleteMessage = async (id) => {
  try {
    // await axios.delete(`http://localhost:3000/api/messages/${id}`);
    const response = await axios.get(
      "https://message-board-server-7yot.onrender.com/api/messages/${id}"
    );
    alert("Message deleted!");
    fetchMessages(); // 刪除後重新載入留言
  } catch (error) {
    console.error("Error deleting message:", error);
    alert("Failed to delete message");
  }
};

const editMessage = (id) => {
  // 你可以選擇導向到編輯頁面，或者開啟編輯表單
  alert(`Edit message with ID: ${id}`);
};

onMounted(() => {
  fetchMessages(); // 頁面加載時獲取留言
});
</script>
