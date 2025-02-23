import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    console.log("Decoded Token:", decoded);
    const currentTime = Math.floor(Date.now() / 1000);
    console.log("當前時間:", currentTime, "過期時間:", decoded.exp);
    if (decoded.exp < currentTime) {
      console.log("Token 已過期");
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Token 解碼錯誤:", error);
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
    accessToken: null,
    refreshToken: null,
  }),
  actions: {
    setUserData(decodedToken) {
      if (!decodedToken) return;
      this.userId = decodedToken.userId;
      this.userName = decodedToken.userName || "未知用户";
      this.userAvatar = decodedToken.userAvatar || "圖片";
      this.role = decodedToken.role;
      localStorage.setItem("userId", this.userId);
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("userAvatar", this.userAvatar);
      localStorage.setItem("role", this.role);
    },
    updateUserData({ userName, userAvatar, role }) {
      if (userName) this.userName = userName;
      if (userAvatar) this.userAvatar = userAvatar;
      if (role) this.role = role;
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("userAvatar", this.userAvatar);
      localStorage.setItem("role", this.role);
    },
    login(data) {
      const { success, accessToken, refreshToken } = data;
      if (!success || !accessToken) {
        console.error("登入數據無效:", data);
        return;
      }
      const decodedToken = verifyToken(accessToken);
      if (!decodedToken) return;
      this.isLoggedIn = true;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken || null;
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      this.setUserData(decodedToken);
    },
    async refreshAccessToken() {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        this.logout();
        return false;
      }
      try {
        const response = await fetch(
          "https://message-board-server-7yot.onrender.com/api/auth/refresh-token",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }
        );
        const data = await response.json();
        console.log("刷新回應:", data);
        if (!data.success || !data.accessToken) {
          console.error("刷新失敗:", data);
          this.logout();
          return false;
        }
        const decodedToken = verifyToken(data.accessToken);
        if (decodedToken) {
          this.accessToken = data.accessToken;
          this.refreshToken = data.refreshToken; // 更新新的 refreshToken
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          this.setUserData(decodedToken);
          return true;
        }
        return false;
      } catch (error) {
        console.error("刷新失敗:", error);
        this.logout();
        return false;
      }
    },
    logout() {
      const initialState = {
        isLoggedIn: false,
        userId: null,
        userName: "",
        userAvatar: "",
        role: "",
        accessToken: null,
        refreshToken: null,
      };
      Object.assign(this, initialState);
      [
        "accessToken",
        "refreshToken",
        "userId",
        "userName",
        "userAvatar",
        "role",
      ].forEach((key) => localStorage.removeItem(key));
    },
    async checkLoginStatus() {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken || typeof accessToken !== "string") {
        console.log("無效的 accessToken，嘗試登出");
        this.logout();
        return;
      }
      let decodedToken = verifyToken(accessToken);
      if (!decodedToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return;
        decodedToken = verifyToken(this.accessToken);
      }
      this.isLoggedIn = true;
      this.accessToken = accessToken; // 確保設置 accessToken
      this.setUserData(decodedToken);
    },
  },
});

export default { verifyToken };
