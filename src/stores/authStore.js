import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode"; // 使用官方的導入方式

const verifyToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Token 解码错误:", error);
    return null;
  }
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isLoggedIn: false,
    userId: null,
    userName: "",
    userAvatar: "",
    role: "",
  }),
  actions: {
    setUserData(decodedToken) {
      if (!decodedToken) return;
      this.userId = decodedToken.userId;
      this.userName = decodedToken.userName || "未知用户";
      this.userName = decodedToken.userAvatar || "圖片";
      this.role = decodedToken.role;
      localStorage.setItem("userId", this.userId);
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("userAvatar", this.userAvatar);
      localStorage.setItem("role", this.role);
    },
    login(token) {
      const decodedToken = verifyToken(token);
      if (!decodedToken) return;
      this.isLoggedIn = true;
      localStorage.setItem("token", token);
      this.setUserData(decodedToken);
    },
    logout() {
      const initialState = {
        isLoggedIn: false,
        userId: null,
        userName: "",
        userAvatar: "",
        role: "",
      };
      Object.assign(this, initialState);
      ["token", "userId", "userName", "userAvatar", "role"].forEach((key) =>
        localStorage.removeItem(key)
      );
    },
    checkLoginStatus() {
      const token = localStorage.getItem("token");
      const decodedToken = verifyToken(token);
      if (decodedToken) {
        this.isLoggedIn = true;
        this.setUserData(decodedToken);
      } else {
        this.logout();
      }
    },
  },
});

export default { verifyToken };
