// usePostStore.js
import { defineStore } from "pinia";
import apiClient from "../stores/axiosConfig";

export const usePostStore = defineStore("post", {
  state: () => ({
    posts: [],
  }),

  actions: {
    async deletePost(postId, userId) {
      try {
        const response = await apiClient.delete(`/posts/${postId}/${userId}`);
        console.log("刪除成功", response.data);
        return response.data.message || "刪除成功";
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error("刪除貼文失敗", errorMsg);
        throw new Error(errorMsg);
      }
    },

    async updatePost(postId, userId, content, fileUrl) {
      try {
        if (!content && !fileUrl) {
          throw new Error("請提供內容或圖片 (content 或 fileUrl 至少擇一)");
        }
        const response = await apiClient.put(`/posts/${postId}/${userId}`, {
          content: content || null,
          fileUrl: fileUrl || null,
        });
        console.log("更新成功", response.data);
        return response.data;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error("更新貼文失敗", errorMsg);
        throw new Error(errorMsg);
      }
    },
  },
});
