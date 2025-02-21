import { defineStore } from "pinia";
import axios from "../stores/axiosConfig"; // 確保你的 axios 設置正確

export const usePostStore = defineStore("post", {
  state: () => ({
    posts: [], // 存儲貼文列表
  }),

  actions: {
    // 刪除貼文
    async deletePost(postId, userId) {
      try {
        const response = await axios.delete(`/posts/${postId}/${userId}`);

        // 刪除成功後，更新本地 posts 狀態
        this.posts = this.posts.filter((post) => post.id !== postId);

        return response.data.message; // 返回 "帖子已删除"
      } catch (error) {
        console.error("刪除貼文失敗", error);
        throw error;
      }
    },
  },
});
