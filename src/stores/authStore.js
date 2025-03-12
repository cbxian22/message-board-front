// useAuthStore.js
import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";
import { useMessage } from "naive-ui";

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
    accountName: "",
    userAvatar: "",
    role: "",
    accessToken: null,
    refreshToken: null,
  }),
  actions: {
    async fetchUserData() {
      if (!this.accessToken || !this.userId) return;
      console.log("Fetching with token:", this.accessToken); // 添加日誌
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
        this.accountName = data.accountname || "未知用戶";
        this.userAvatar =
          data.avatar_url ||
          "https://storage.googleapis.com/message_board_storage/default_profile.jpg";
        this.role = data.role || "";
        localStorage.setItem("userName", this.userName);
        localStorage.setItem("accountName", this.accountName);
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
      this.refreshToken = refreshToken;
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

        await this.fetchUserData();
        return true;
      } catch (error) {
        console.error("Error during token refresh:", error);
        this.logout();
        return false;
      }
    },
    async logout() {
      const refreshToken = this.refreshToken;
      if (refreshToken) {
        try {
          const response = await fetch(
            "https://message-board-server-7yot.onrender.com/api/auth/logout",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );
          if (!response.ok) {
            console.error("Logout request failed:", await response.json());
          } else {
            console.log("Successfully logged out from server.");
          }
        } catch (error) {
          console.error("Error during logout:", error);
        }
      }

      // 清空本地狀態和存儲
      Object.assign(this, {
        isLoggedIn: false,
        userId: null,
        userName: "",
        accountName: "",
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
        "accountName",
        "userAvatar",
        "role",
      ].forEach((key) => localStorage.removeItem(key));
    },
    async logoutAll() {
      const accessToken = this.accessToken;
      if (!accessToken) {
        console.warn("No access token found, cannot logout all devices.");
        return;
      }

      try {
        const response = await fetch(
          "https://message-board-server-7yot.onrender.com/api/auth/logout-all",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Logout all request failed:", await response.json());
        } else {
          console.log("Successfully logged out from all devices.");
        }
      } catch (error) {
        console.error("Error during logout all:", error);
      }

      // 清空本地狀態和存儲（與 logout 相同）
      Object.assign(this, {
        isLoggedIn: false,
        userId: null,
        userName: "",
        accountName: "",
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
        "accountName",
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
