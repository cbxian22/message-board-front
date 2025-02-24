// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode";

// const verifyToken = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     // console.log("Decoded Token:", decoded);
//     const currentTime = Math.floor(Date.now() / 1000);
//     // console.log("當前時間:", currentTime, "過期時間:", decoded.exp);
//     if (decoded.exp < currentTime) {
//       console.log("Token 已過期");
//       return null;
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
//     accessToken: null,
//     refreshToken: null,
//   }),
//   actions: {
//     setUserData(decodedToken) {
//       if (!decodedToken) return;
//       this.userId = decodedToken.userId;
//       this.userName = decodedToken.userName || "未知用户";
//       // 只在 userAvatar 未定義時從 token 更新，避免覆蓋 localStorage 的值
//       if (!this.userAvatar) {
//         this.userAvatar = decodedToken.userAvatar || "圖片";
//       }
//       this.role = decodedToken.role;
//       localStorage.setItem("userId", this.userId);
//       localStorage.setItem("userName", this.userName);
//       localStorage.setItem("userAvatar", this.userAvatar);
//       localStorage.setItem("role", this.role);
//     },
//     updateUserData({ userName, userAvatar, role }) {
//       // 使用條件更新並觸發響應式變化
//       if (userName !== undefined) this.userName = userName;
//       if (userAvatar !== undefined) this.userAvatar = userAvatar;
//       if (role !== undefined) this.role = role;

//       // 更新 localStorage
//       localStorage.setItem("userName", this.userName);
//       localStorage.setItem("userAvatar", this.userAvatar);
//       localStorage.setItem("role", this.role);
//     },
//     login(data) {
//       const { success, accessToken, refreshToken } = data;
//       if (!success || !accessToken) {
//         console.error("登入數據無效:", data);
//         return;
//       }
//       const decodedToken = verifyToken(accessToken);
//       if (!decodedToken) return;
//       this.isLoggedIn = true;
//       this.accessToken = accessToken;
//       this.refreshToken = refreshToken || null;
//       localStorage.setItem("accessToken", accessToken);
//       if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
//       this.setUserData(decodedToken);
//     },
//     async refreshAccessToken() {
//       const refreshToken = localStorage.getItem("refreshToken");
//       if (!refreshToken) {
//         this.logout();
//         return false;
//       }
//       try {
//         const response = await fetch(
//           "https://message-board-server-7yot.onrender.com/api/auth/refresh-token",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ refreshToken }),
//           }
//         );
//         const data = await response.json();
//         console.log("刷新回應:", data);
//         if (!data.success || !data.accessToken) {
//           console.error("刷新失敗:", data);
//           this.logout();
//           return false;
//         }
//         const decodedToken = verifyToken(data.accessToken);
//         if (decodedToken) {
//           this.accessToken = data.accessToken;
//           this.refreshToken = data.refreshToken; // 更新新的 refreshToken
//           localStorage.setItem("accessToken", data.accessToken);
//           localStorage.setItem("refreshToken", data.refreshToken);
//           this.setUserData(decodedToken);
//           return true;
//         }
//         return false;
//       } catch (error) {
//         console.error("刷新失敗:", error);
//         this.logout();
//         return false;
//       }
//     },
//     logout() {
//       const initialState = {
//         isLoggedIn: false,
//         userId: null,
//         userName: "",
//         userAvatar: "",
//         role: "",
//         accessToken: null,
//         refreshToken: null,
//       };
//       Object.assign(this, initialState);
//       [
//         "accessToken",
//         "refreshToken",
//         "userId",
//         "userName",
//         "userAvatar",
//         "role",
//       ].forEach((key) => localStorage.removeItem(key));
//     },
//     async checkLoginStatus() {
//       const accessToken = localStorage.getItem("accessToken");
//       console.log("accessToken:", accessToken);
//       let decodedToken = verifyToken(accessToken);
//       console.log("decodedToken:", decodedToken);
//       if (!decodedToken) {
//         const refreshed = await this.refreshAccessToken();
//         console.log("刷新結果:", refreshed);
//         if (!refreshed) return;
//         decodedToken = verifyToken(this.accessToken);
//       }
//       this.isLoggedIn = true;
//       this.accessToken = accessToken;

//       // 優先從 localStorage 載入 userAvatar
//       const storedAvatar = localStorage.getItem("userAvatar");
//       if (storedAvatar && storedAvatar !== "圖片") {
//         this.userAvatar = storedAvatar;
//       } else {
//         this.setUserData(decodedToken); // 否則從 token 初始化
//       }
//       console.log("最終 userAvatar:", this.userAvatar);
//     },
//   },
// });

// export default { verifyToken };

import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Math.floor(Date.now() / 1000) ? decoded : null;
  } catch (error) {
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
    async fetchUserData() {
      if (!this.accessToken || !this.userId) return;
      try {
        const response = await fetch(
          "https://message-board-server-7yot.onrender.com/api/auth/me",
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );
        const data = await response.json();
        this.userName = data.name || "未知用戶";
        this.userAvatar =
          data.avatar_url ||
          "https://storage.googleapis.com/message_board_storage/default_profile.jpg";
        this.role = data.role || "";
        localStorage.setItem("userName", this.userName);
        localStorage.setItem("userAvatar", this.userAvatar);
        localStorage.setItem("role", this.role);
      } catch (error) {
        console.error("獲取用戶資料失敗:", error);
      }
    },
    login(data) {
      const { success, accessToken, refreshToken } = data;
      if (!success || !accessToken) return;

      const decodedToken = verifyToken(accessToken);
      if (!decodedToken) return;

      this.isLoggedIn = true;
      this.userId = decodedToken.userId;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", this.userId);

      this.fetchUserData();
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

        if (!data.success || !data.accessToken) {
          this.logout();
          return false;
        }

        const decodedToken = verifyToken(data.accessToken);
        if (!decodedToken) {
          this.logout();
          return false;
        }

        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.userId = decodedToken.userId;
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("userId", this.userId);

        await this.fetchUserData();
        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    },
    logout() {
      Object.assign(this, {
        isLoggedIn: false,
        userId: null,
        userName: "",
        userAvatar: "",
        role: "",
        accessToken: null,
        refreshToken: null,
      });
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
      if (!accessToken) return;

      let decodedToken = verifyToken(accessToken);
      if (!decodedToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return;
        decodedToken = verifyToken(this.accessToken);
      }

      this.isLoggedIn = true;
      this.accessToken = accessToken;
      this.userId = decodedToken.userId;
      await this.fetchUserData();
    },
  },
});

export default { verifyToken };
