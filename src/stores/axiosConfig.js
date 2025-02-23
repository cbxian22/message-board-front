// import axios from "axios";
// import { useAuthStore } from "../stores/authStore"; // 引入 Pinia 的 authStore

// // 创建自定义的 axios 实例
// const apiClient = axios.create({
//   baseURL: "https://message-board-server-7yot.onrender.com/api", // 设置基础 URL
//   headers: { "Content-Type": "application/json" }, // 设置默认头部
// });

// // 确保每次请求前都设置 Authorization 头
// apiClient.interceptors.request.use(
//   (config) => {
//     const authStore = useAuthStore();
//     const token = authStore.token;
//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default apiClient;

import axios from "axios";
import { useAuthStore } from "../stores/authStore";

// 创建自定义的 axios 实例
const apiClient = axios.create({
  baseURL: "https://message-board-server-7yot.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：设置 Authorization 头
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.accessToken; // 使用 accessToken
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理 token 过期并刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 标记为重试，避免无限循环
      const authStore = useAuthStore();
      const refreshed = await authStore.refreshAccessToken();
      if (refreshed) {
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${authStore.accessToken}`;
        return apiClient(originalRequest); // 重试原始请求
      }
      // 如果刷新失败，登出用户
      authStore.logout();
      return Promise.reject(new Error("無法刷新 Token，請重新登入"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
