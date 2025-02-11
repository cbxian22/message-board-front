<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const comment = ref([]);
const replies = ref([]);
const newReply = ref("");
const route = useRoute();

// 獲取留言詳細內容
const fetchComment = async () => {
  try {
    const response = await axios.get(
      // `http://localhost:3000/api/posts/${route.params.id}`
      `https://message-board-server-7yot.onrender.com/api/posts/${route.params.id}`
    );
    if (response.status === 200) {
      comment.value = response.data;
      console.log(response.data);
    } else {
      alert("無法獲取留言詳細內容");
    }
  } catch (error) {
    console.error("取得留言詳細錯誤:", error);
    alert("留言詳細取得失敗，請稍後再試");
  }
};

// 獲取回覆

const fetchReplies = async () => {
  try {
    const response = await axios.get(
      // `http://localhost:3000/api/replies/${route.params.id}`
      `https://message-board-server-7yot.onrender.com/api/replies/${route.params.id}`
    );
    if (response.status === 200) {
      replies.value = response.data;
      console.log("回覆數據:", replies.value);
    } else {
      alert("無法獲取留言詳細內容");
    }
  } catch (error) {
    console.error("取得留言詳細錯誤:", error);
    alert("留言詳細取得失敗，請稍後再試");
  }
};

// 格式化時間
const formatDate = (date) => {
  if (!date) return "未知時間";
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("zh-TW", options);
};

// 提交回覆
const handleReply = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (!token) {
    alert("請先登入以新增回覆！");
    return;
  }
  try {
    // 使用 userId 構建正确的 API 路徑
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/replies/${route.params.id}/${userId}`,
      // `http://localhost:3000/api/replies/${route.params.id}/${userId}`,
      {
        content: newReply.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 將 Token 添加到請求頭中
        },
      }
    );

    if (response.status === 201) {
      replies.value.push(response.data); // 將新回覆添加到回覆列表
      newReply.value = "";
      await fetchReplies(); // 取代刷新頁面
      // window.location.reload();
    } else {
      alert("回覆失敗，請重試！");
    }
  } catch (error) {
    console.error("回覆時發生錯誤：", error);
    alert("回覆失敗，請稍後再試！");
  }
};

// 組件加載時獲取數據
onMounted(() => {
  fetchComment();
  fetchReplies();
});
</script>

<template>
  <div class="comment-detail">
    <!-- <h3>{{ comment.title }}</h3> -->
    <p class="comment-content">{{ comment.content }}</p>
    <p class="comment-author">貼文者: {{ comment.user_name }}</p>
    <p class="comment-time">貼文時間: {{ formatDate(comment.created_at) }}</p>
    <p v-if="comment.file_url" class="comment-file">
      附件: <a :href="comment.file_url" target="_blank">下載</a>
    </p>
    <div class="replies">
      <h4>回覆留言</h4>
      <div v-for="reply in replies" :key="reply.id" class="reply">
        <p class="reply-content">回覆內容: {{ reply.content }}</p>
        <p class="reply-time">回覆時間: {{ formatDate(reply.created_at) }}</p>
        <p class="reply-author">回覆者: {{ reply.replies_name }}</p>
      </div>
    </div>
    <div class="add-reply">
      <form @submit.prevent="handleReply" class="reply-form">
        <input v-model="newReply" placeholder="輸入回覆內容" required />
        <button type="submit" class="submit-btn">送出回覆</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 註明區 */
.comment-detail {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 標題樣式 */
.comment-detail h3 {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

/* 內容 */
.comment-content {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
}

/* 作者和時間 */
.comment-author,
.comment-time {
  font-size: 0.9rem;
  color: #777;
}

/* 附件樣式 */
.comment-file {
  margin-top: 10px;
  font-size: 1rem;
}

.comment-file a {
  text-decoration: none;
  color: #007bff;
}

.comment-file a:hover {
  text-decoration: underline;
}

/* 回覆區域 */
.replies {
  margin-top: 30px;
}

.replies h4 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

/* 單一回覆樣式 */
.reply {
  padding: 15px;
  margin-top: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reply-content,
.reply-time,
.reply-author {
  font-size: 1rem;
  color: #555;
}

/* 回覆表單 */
.add-reply {
  margin-top: 30px;
}

.reply-form input {
  width: 100%;
  max-width: 600px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  margin-bottom: 10px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #0056b3;
}
</style>
