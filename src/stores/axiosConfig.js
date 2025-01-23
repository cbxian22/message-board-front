import axios from "axios";

// 每次请求前检查 localStorage 的 token
const setAuthorizationHeader = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"]; // 没有 token 时，删除 Authorization
  }
};

// 确保每次请求前都设置 Authorization 头
axios.interceptors.request.use(
  (config) => {
    setAuthorizationHeader();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
