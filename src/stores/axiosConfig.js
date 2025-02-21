// import axios from "axios";

// // 每次请求前检查 localStorage 的 token
// const setAuthorizationHeader = () => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//   } else {
//     delete axios.defaults.headers.common["Authorization"]; // 没有 token 时，删除 Authorization
//   }
// };

// // 确保每次请求前都设置 Authorization 头
// axios.interceptors.request.use(
//   (config) => {
//     setAuthorizationHeader();
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default axios;

import axios from "axios";
import { useAuthStore } from "../stores/authStore"; // 引入 Pinia 的 authStore

// 创建自定义的 axios 实例
const apiClient = axios.create({
  baseURL: "https://message-board-server-7yot.onrender.com/api", // 设置基础 URL
  headers: { "Content-Type": "application/json" }, // 设置默认头部
});

// 确保每次请求前都设置 Authorization 头
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
