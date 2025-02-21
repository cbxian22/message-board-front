import { defineStore } from "pinia";
import apiClient from "../stores/axiosConfig";

export const usePostStore = defineStore("post", {
  state: () => ({
    posts: [], // 存儲貼文列表
  }),

  actions: {
    // 刪除貼文
    async deletePost(postId, userId) {
      try {
        const response = await apiClient.delete(`/posts/${postId}/${userId}`);
        console.log("刪除成功", response.data);
      } catch (error) {
        console.error("刪除貼文失敗", error);
      }
    },
  },
});
