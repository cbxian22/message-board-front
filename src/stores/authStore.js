// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode"; // 使用官方的導入方式

// const verifyToken = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     console.log("Decoded Token:", decoded); // 確認解碼後的 Token 內容
//     const currentTime = Math.floor(Date.now() / 1000); // 當前時間 (秒)
//     if (decoded.exp < currentTime) {
//       console.log("Token 已過期");
//       return null; // 如果過期，返回 null
//     }
//     return decoded;
//   } catch (error) {
//     console.error("Token 解碼錯誤:", error);
//     return null;
//   }
// };

// export const useAuthStore = defineStore("auth", {
//   state: () => ({
//     isLoggedIn: false,
//     userId: null,
//     userName: "",
//     userAvatar: "",
//     role: "",
//   }),
//   actions: {
//     setUserData(decodedToken) {
//       if (!decodedToken) return;
//       this.userId = decodedToken.userId;
//       this.userName = decodedToken.userName || "未知用户";
//       this.userAvatar = decodedToken.userAvatar || "圖片";
//       this.role = decodedToken.role;
//       localStorage.setItem("userId", this.userId);
//       localStorage.setItem("userName", this.userName);
//       localStorage.setItem("userAvatar", this.userAvatar);
//       localStorage.setItem("role", this.role);
//     },
//     login(token) {
//       const decodedToken = verifyToken(token);
//       if (!decodedToken) return;
//       this.isLoggedIn = true;
//       localStorage.setItem("token", token);
//       this.setUserData(decodedToken);
//     },
//     logout() {
//       const initialState = {
//         isLoggedIn: false,
//         userId: null,
//         userName: "",
//         userAvatar: "",
//         role: "",
//       };
//       Object.assign(this, initialState);
//       ["token", "userId", "userName", "userAvatar", "role"].forEach((key) =>
//         localStorage.removeItem(key)
//       );
//     },
//     checkLoginStatus() {
//       const token = localStorage.getItem("token");
//       const decodedToken = verifyToken(token);
//       if (decodedToken) {
//         this.isLoggedIn = true;
//         this.setUserData(decodedToken);
//       } else {
//         this.logout();
//       }
//     },
//   },
// });

// export default { verifyToken };

import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    console.log("Decoded Token:", decoded);
    const currentTime = Math.floor(Date.now() / 1000);
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
    // 新增的更新用戶資料方法
    updateUserData({ userName, userAvatar, role }) {
      if (userName) this.userName = userName;
      if (userAvatar) this.userAvatar = userAvatar;
      if (role) this.role = role;
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("userAvatar", this.userAvatar);
      localStorage.setItem("role", this.role);
    },
    login({ accessToken, refreshToken }) {
      const decodedToken = verifyToken(accessToken);
      if (!decodedToken) return;
      this.isLoggedIn = true;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      this.setUserData(decodedToken);
    },
    async refreshAccessToken() {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        this.logout();
        return false;
      }
      try {
        const response = await fetch("/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const { accessToken } = await response.json();
        const decodedToken = verifyToken(accessToken);
        if (decodedToken) {
          this.accessToken = accessToken;
          localStorage.setItem("accessToken", accessToken);
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
      let accessToken = localStorage.getItem("accessToken");
      let decodedToken = verifyToken(accessToken);
      if (!decodedToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return;
        accessToken = this.accessToken;
        decodedToken = verifyToken(accessToken);
      }
      this.isLoggedIn = true;
      this.setUserData(decodedToken);
    },
  },
});

export default { verifyToken };
