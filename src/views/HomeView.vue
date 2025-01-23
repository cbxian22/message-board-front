<template>
  <div class="homepage">
    <h1 class="page-title">留言板</h1>
    <!-- 新增留言按鈕 -->
    <button @click="goToMessagePage" class="add-comment-btn">新增留言</button>
    <singleComment />
    <router-view></router-view>
  </div>
</template>

<script setup>
import singleComment from "../components/singleComment.vue";
import { useRouter } from "vue-router";
const router = useRouter();

// 跳轉到 MessageView
const goToMessagePage = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("請先登入以新增留言！");
    return;
  }
  router.push({ name: "Message" });
};
</script>

<style scoped>
/* 整體容器 */
.homepage {
  max-width: 900px;
  margin: 30px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 主標題 */
.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

/* 新增留言按鈕 */
.add-comment-btn {
  background-color: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1.5rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  transition: background-color 0.3s ease;
}

.add-comment-btn:hover {
  background-color: #0056b3;
}

/* 單一留言的樣式 (同樣延用 previous 設計) */
.single-comment {
  border: 1px solid #ececec;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 1.5rem;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.single-comment:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>
