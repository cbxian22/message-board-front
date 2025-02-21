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
        const response = await apiClient.delete(`/posts/${postId}/${userId}`);
        this.posts = this.posts.filter((post) => post.id !== postId);
        return response.data.message;
      } catch (error) {
        console.error("刪除貼文失敗", error);
        throw error;
      }
    },
  },
});
