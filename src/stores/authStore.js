// // useAuthStore.js
// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode";
// import { useMessage } from "naive-ui";

// const verifyToken = (token) => {
//   try {
//     const decoded = jwtDecode(token);
//     const isValid = decoded.exp > Math.floor(Date.now() / 1000);
//     console.log("Token decoded:", decoded, "Valid:", isValid);
//     return isValid ? decoded : null;
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return null;
//   }
// };

// export const useAuthStore = defineStore("auth", {
//   state: () => ({
//     isLoggedIn: false,
//     userId: null,
//     userName: "",
//     accountName: "",
//     userAvatar: "",
//     role: "",
//     accessToken: null,
//     refreshToken: null,
//     isPrivate: false, // 添加 isPrivate
//   }),
//   actions: {
//     async fetchUserData() {
//       if (!this.accessToken || !this.userId) return;
//       console.log("Fetching with token:", this.accessToken); // 添加日誌
//       try {
//         const response = await fetch(
//           "https://message-board-server-7yot.onrender.com/api/auth/me",
//           {
//             headers: { Authorization: `Bearer ${this.accessToken}` },
//           }
//         );
//         if (!response.ok) throw new Error("Failed to fetch user data");
//         const data = await response.json();
//         this.userName = data.name || "未知用戶";
//         this.accountName = data.accountname || "未知用戶";
//         this.userAvatar =
//           data.avatar_url ||
//           "https://storage.googleapis.com/message_board_storage/default_profile.jpg";
//         this.role = data.role || "";
//         localStorage.setItem("userName", this.userName);
//         localStorage.setItem("accountName", this.accountName);
//         localStorage.setItem("userAvatar", this.userAvatar);
//         localStorage.setItem("role", this.role);
//       } catch (error) {
//         console.error("獲取用戶資料失敗:", error);
//       }
//     },
//     login(data) {
//       const { success, accessToken, refreshToken } = data;
//       if (!success || !accessToken || !refreshToken) return;

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
//         console.warn("No refresh token found, logging out.");
//         this.logout();
//         return false;
//       }

//       const decodedRefresh = verifyToken(refreshToken);
//       if (!decodedRefresh) {
//         console.warn("Refresh token expired, logging out.");
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

//         if (!response.ok) {
//           const errorData = await response.json();
//           console.error(
//             "Refresh token request failed:",
//             response.status,
//             errorData
//           );
//           this.logout();
//           return false;
//         }

//         const data = await response.json();
//         if (!data.success || !data.accessToken) {
//           console.error("Invalid refresh token response:", data);
//           this.logout();
//           return false;
//         }

//         const decodedToken = verifyToken(data.accessToken);
//         if (!decodedToken) {
//           console.error("Invalid new access token:", data.accessToken);
//           this.logout();
//           return false;
//         }

//         this.accessToken = data.accessToken;
//         this.userId = decodedToken.userId;
//         localStorage.setItem("accessToken", data.accessToken);
//         localStorage.setItem("userId", this.userId);

//         await this.fetchUserData();
//         return true;
//       } catch (error) {
//         console.error("Error during token refresh:", error);
//         this.logout();
//         return false;
//       }
//     },
//     async logout() {
//       const refreshToken = this.refreshToken;
//       if (refreshToken) {
//         try {
//           const response = await fetch(
//             "https://message-board-server-7yot.onrender.com/api/auth/logout",
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ refreshToken }),
//             }
//           );
//           if (!response.ok) {
//             console.error("Logout request failed:", await response.json());
//           } else {
//             console.log("Successfully logged out from server.");
//           }
//         } catch (error) {
//           console.error("Error during logout:", error);
//         }
//       }

//       // 清空本地狀態和存儲
//       Object.assign(this, {
//         isLoggedIn: false,
//         userId: null,
//         userName: "",
//         accountName: "",
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
//         "accountName",
//         "userAvatar",
//         "role",
//       ].forEach((key) => localStorage.removeItem(key));
//     },
//     async logoutAll() {
//       const accessToken = this.accessToken;
//       if (!accessToken) {
//         console.warn("No access token found, cannot logout all devices.");
//         return;
//       }

//       try {
//         const response = await fetch(
//           "https://message-board-server-7yot.onrender.com/api/auth/logout-all",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${accessToken}`,
//             },
//           }
//         );

//         if (!response.ok) {
//           console.error("Logout all request failed:", await response.json());
//         } else {
//           console.log("Successfully logged out from all devices.");
//         }
//       } catch (error) {
//         console.error("Error during logout all:", error);
//       }

//       // 清空本地狀態和存儲（與 logout 相同）
//       Object.assign(this, {
//         isLoggedIn: false,
//         userId: null,
//         userName: "",
//         accountName: "",
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
//         "accountName",
//         "userAvatar",
//         "role",
//       ].forEach((key) => localStorage.removeItem(key));
//     },
//     async checkLoginStatus() {
//       const accessToken = localStorage.getItem("accessToken");
//       if (!accessToken) {
//         console.warn("No access token found.");
//         this.isLoggedIn = false;
//         return false;
//       }

//       let decodedToken = verifyToken(accessToken);
//       if (!decodedToken) {
//         console.log("Access token expired or invalid, attempting refresh.");
//         const refreshed = await this.refreshAccessToken();
//         if (!refreshed) {
//           console.warn("Token refresh failed, user not logged in.");
//           this.isLoggedIn = false;
//           return false;
//         }
//         decodedToken = verifyToken(this.accessToken);
//         if (!decodedToken) {
//           console.error("New access token invalid after refresh.");
//           this.isLoggedIn = false;
//           return false;
//         }
//       }

//       this.isLoggedIn = true;
//       this.accessToken = accessToken;
//       this.userId = decodedToken.userId;
//       await this.fetchUserData();
//       return true;
//     },
//   },
// });

// export default { verifyToken };

// useAuthStore.js
import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";
import { useMessage } from "naive-ui"; // 引入 Naive UI 的消息組件

const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    const isValid = decoded.exp > Math.floor(Date.now() / 1000);
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
    accountName: "",
    userAvatar: "",
    role: "",
    isPrivate: false, // 添加 isPrivate
    accessToken: null,
    refreshToken: null,
  }),
  actions: {
    async fetchUserData() {
      const message = useMessage();
      if (!this.accessToken || !this.userId) {
        console.warn("缺少 accessToken 或 userId，未獲取用戶資料");
        return;
      }
      try {
        const response = await fetch(
          "https://message-board-server-7yot.onrender.com/api/auth/me",
          {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          }
        );
        if (response.status === 401) {
          console.log("Access token 過期，嘗試刷新...");
          const refreshed = await this.refreshAccessToken();
          if (!refreshed) {
            message.warning("您的登入已過期，請重新登入", { duration: 5000 });
            this.logout();
            return;
          }
          return await this.fetchUserData();
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        const data = await response.json();
        this.userName = data.name || "未知用戶";
        this.accountName = data.accountname || "未知用戶";
        this.userAvatar =
          data.avatar_url ||
          "https://storage.googleapis.com/message_board_storage/default_profile.jpg";
        this.role = data.role || "";
        this.isPrivate = data.is_private || false;
        localStorage.setItem("userName", this.userName);
        localStorage.setItem("accountName", this.accountName);
        localStorage.setItem("userAvatar", this.userAvatar);
        localStorage.setItem("role", this.role);
        localStorage.setItem("isPrivate", this.isPrivate);
      } catch (error) {
        console.error("獲取用戶資料失敗:", error);
        message.error("無法獲取用戶資料，請稍後再試", { duration: 5000 }); // 添加錯誤提示
      }
    },
    async refreshAccessToken() {
      const message = useMessage(); // 在方法內部獲取 message
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.warn("No refresh token found, logging out.");
        this.logout();
        message.warning("您的登入已過期，請重新登入", { duration: 5000 });
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
          console.error("Refresh token request failed:", response.status);
          this.logout();
          message.warning("您的登入已過期，請重新登入", { duration: 5000 });
          return false;
        }

        const data = await response.json();
        if (!data.success || !data.accessToken) {
          console.error("Invalid refresh token response:", data);
          this.logout();
          message.warning("您的登入已過期，請重新登入", { duration: 5000 });
          return false;
        }

        const decodedToken = verifyToken(data.accessToken);
        if (!decodedToken) {
          console.error("Invalid new access token:", data.accessToken);
          this.logout();
          message.warning("您的登入已過期，請重新登入", { duration: 5000 });
          return false;
        }

        this.accessToken = data.accessToken;
        this.userId = decodedToken.userId;
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userId", this.userId);
        await this.fetchUserData();
        return true;
      } catch (error) {
        console.error("Error during token refresh:", error);
        this.logout();
        message.warning("您的登入已過期，請重新登入", { duration: 5000 });
        return false;
      }
    },
    async logout() {
      const refreshToken = this.refreshToken;
      if (refreshToken) {
        try {
          await fetch(
            "https://message-board-server-7yot.onrender.com/api/auth/logout",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );
        } catch (error) {
          console.error("Error during logout:", error);
        }
      }
      Object.assign(this, {
        isLoggedIn: false,
        userId: null,
        userName: "",
        accountName: "",
        userAvatar: "",
        role: "",
        isPrivate: false,
        accessToken: null,
        refreshToken: null,
      });
      [
        "accessToken",
        "refreshToken",
        "userId",
        "userName",
        "accountName",
        "userAvatar",
        "role",
        "isPrivate",
      ].forEach((key) => localStorage.removeItem(key));
    },
    async checkLoginStatus() {
      const message = useMessage(); // 添加 message
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        this.isLoggedIn = false;
        return false;
      }

      let decodedToken = verifyToken(accessToken);
      if (!decodedToken) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          this.isLoggedIn = false;
          message.warning("您的登入已過期，請重新登入", { duration: 5000 }); // 添加提醒
          return false;
        }
        decodedToken = verifyToken(this.accessToken);
      }

      this.isLoggedIn = true;
      this.accessToken = accessToken;
      this.userId = decodedToken.userId;
      await this.fetchUserData();
      return true;
    },
  },
});
