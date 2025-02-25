// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode";

// const verifyToken = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     return decoded.exp > Math.floor(Date.now() / 1000) ? decoded : null;
//   } catch (error) {
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
//     async fetchUserData() {
//       if (!this.accessToken || !this.userId) return;
//       try {
//         const response = await fetch(
//           "https://message-board-server-7yot.onrender.com/api/auth/me",
//           {
//             headers: { Authorization: `Bearer ${this.accessToken}` },
//           }
//         );
//         const data = await response.json();
//         this.userName = data.name || "未知用戶";
//         this.userAvatar =
//           data.avatar_url ||
//           "https://storage.googleapis.com/message_board_storage/default_profile.jpg";
//         this.role = data.role || "";
//         localStorage.setItem("userName", this.userName);
//         localStorage.setItem("userAvatar", this.userAvatar);
//         localStorage.setItem("role", this.role);
//       } catch (error) {
//         console.error("獲取用戶資料失敗:", error);
//       }
//     },
//     login(data) {
//       const { success, accessToken, refreshToken } = data;
//       if (!success || !accessToken) return;

//       const decodedToken = verifyToken(accessToken);
//       if (!decodedToken) return;

//       this.isLoggedIn = true;
//       this.userId = decodedToken.userId;
//       this.accessToken = accessToken;
//       this.refreshToken = refreshToken;
//       localStorage.setItem("accessToken", accessToken);
//       localStorage.setItem("refreshToken", refreshToken);
//       localStorage.setItem("userId", this.userId);

//       this.fetchUserData();
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

//         if (!data.success || !data.accessToken) {
//           this.logout();
//           return false;
//         }

//         const decodedToken = verifyToken(data.accessToken);
//         if (!decodedToken) {
//           this.logout();
//           return false;
//         }

//         this.accessToken = data.accessToken;
//         this.refreshToken = data.refreshToken;
//         this.userId = decodedToken.userId;
//         localStorage.setItem("accessToken", data.accessToken);
//         localStorage.setItem("refreshToken", data.refreshToken);
//         localStorage.setItem("userId", this.userId);

//         await this.fetchUserData();
//         return true;
//       } catch (error) {
//         this.logout();
//         return false;
//       }
//     },
//     logout() {
//       Object.assign(this, {
//         isLoggedIn: false,
//         userId: null,
//         userName: "",
//         userAvatar: "",
//         role: "",
//         accessToken: null,
//         refreshToken: null,
//       });
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
//       if (!accessToken) return;

//       let decodedToken = verifyToken(accessToken);
//       if (!decodedToken) {
//         const refreshed = await this.refreshAccessToken();
//         if (!refreshed) return;
//         decodedToken = verifyToken(this.accessToken);
//       }

//       this.isLoggedIn = true;
//       this.accessToken = accessToken;
//       this.userId = decodedToken.userId;
//       await this.fetchUserData();
//     },
//   },
// });

// export default { verifyToken };

import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    const isValid = decoded.exp > Math.floor(Date.now() / 1000);
    console.log("Token decoded:", decoded, "Valid:", isValid);
    return isValid ? decoded : null;
  } catch (error) {
    console.error("Token verification failed:", error);
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
        if (!response.ok) throw new Error("Failed to fetch user data");
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
      if (!success || !accessToken || !refreshToken) return;

      const decodedToken = verifyToken(accessToken);
      if (!decodedToken) return;

      this.isLoggedIn = true;
      this.userId = decodedToken.userId;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken; // 初始設置 refreshToken
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", this.userId);

      this.fetchUserData();
    },
    async refreshAccessToken() {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.warn("No refresh token found, logging out.");
        this.logout();
        return false;
      }

      // 檢查 refreshToken 是否過期
      const decodedRefresh = verifyToken(refreshToken);
      if (!decodedRefresh) {
        console.warn("Refresh token expired, logging out.");
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

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "Refresh token request failed:",
            response.status,
            errorData
          );
          this.logout();
          return false;
        }

        const data = await response.json();
        if (!data.success || !data.accessToken) {
          console.error("Invalid refresh token response:", data);
          this.logout();
          return false;
        }

        const decodedToken = verifyToken(data.accessToken);
        if (!decodedToken) {
          console.error("Invalid new access token:", data.accessToken);
          this.logout();
          return false;
        }

        this.accessToken = data.accessToken;
        this.userId = decodedToken.userId;
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userId", this.userId);
        // 注意：這裡不再更新 refreshToken，除非後端明確要求替換

        await this.fetchUserData();
        return true;
      } catch (error) {
        console.error("Error during token refresh:", error);
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
      if (!accessToken) {
        console.warn("No access token found.");
        this.isLoggedIn = false;
        return false;
      }

      let decodedToken = verifyToken(accessToken);
      if (!decodedToken) {
        console.log("Access token expired or invalid, attempting refresh.");
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          console.warn("Token refresh failed, user not logged in.");
          this.isLoggedIn = false;
          return false;
        }
        decodedToken = verifyToken(this.accessToken);
        if (!decodedToken) {
          console.error("New access token invalid after refresh.");
          this.isLoggedIn = false;
          return false;
        }
      }

      this.isLoggedIn = true;
      this.accessToken = accessToken;
      this.userId = decodedToken.userId;
      await this.fetchUserData();
      return true;
    },
  },
});

export default { verifyToken };
