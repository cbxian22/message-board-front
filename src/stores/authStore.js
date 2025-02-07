import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode"; // 使用官方的導入方式

const verifyToken = (token) => {
  try {
    const decodedToken = jwtDecode(token); // 使用官方的 jwtDecode 函数
    return decodedToken;
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
    role: "",
    needsLoginModal: false,
  }),
  actions: {
    login(token) {
      this.isLoggedIn = true;
      localStorage.setItem("token", token);

      // 解碼token用戶取得ID、名稱、角色並存儲
      const decodedToken = verifyToken(token);
      if (decodedToken) {
        this.userId = decodedToken.userId;
        this.userName = decodedToken.userName || "未知用户";
        this.role = decodedToken.role;
        localStorage.setItem("userId", this.userId);
        localStorage.setItem("userName", this.userName);
        localStorage.setItem("role", this.role);
      }

      this.needsLoginModal = false; // 成功登入後關閉彈窗
    },
    logout() {
      this.isLoggedIn = false;
      this.userId = null;
      this.userName = "";
      this.role = "";
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("role");
    },
    checkLoginStatus() {
      const token = localStorage.getItem("token");
      this.isLoggedIn = !!token;
      if (this.isLoggedIn) {
        const decodedToken = verifyToken(token);
        if (decodedToken) {
          this.userId = decodedToken.userId;
          this.userName = decodedToken.userName || "未知用户";
          this.role = decodedToken.role;
        } else {
          this.logout();
        }
      }

      this.needsLoginModal = false;
    },
  },
});

export default { verifyToken };
