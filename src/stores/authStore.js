// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode"; // 使用官方的導入方式

// const verifyToken = (token) => {
//   try {
//     const decodedToken = jwtDecode(token); // 使用官方的 jwtDecode 函数
//     return decodedToken;
//   } catch (error) {
//     console.error("Token 解码错误:", error);
//     return null;
//   }
// };

// export const useAuthStore = defineStore("auth", {
//   state: () => ({
//     isLoggedIn: false,
//     userId: null,
//     userName: "",
//     role: "",
//   }),
//   actions: {
//     login(token) {
//       this.isLoggedIn = true;
//       localStorage.setItem("token", token);

//       // 解碼token用戶取得ID、名稱、角色並存儲
//       const decodedToken = verifyToken(token);
//       if (decodedToken) {
//         this.userId = decodedToken.userId;
//         this.userName = decodedToken.userName || "未知用户";
//         this.role = decodedToken.role;
//         localStorage.setItem("userId", this.userId);
//         localStorage.setItem("userName", this.userName);
//         localStorage.setItem("role", this.role);
//       }
//     },
//     logout() {
//       this.isLoggedIn = false;
//       this.userId = null;
//       this.userName = "";
//       this.role = "";
//       localStorage.removeItem("token");
//       localStorage.removeItem("userId");
//       localStorage.removeItem("userName");
//       localStorage.removeItem("role");
//     },
//     checkLoginStatus() {
//       const token = localStorage.getItem("token");
//       this.isLoggedIn = !!token;
//       if (this.isLoggedIn) {
//         const decodedToken = verifyToken(token);
//         if (decodedToken) {
//           this.userId = decodedToken.userId;
//           this.userName = decodedToken.userName || "未知用户";
//           this.role = decodedToken.role;
//         } else {
//           this.logout();
//         }
//       }
//     },
//   },
// });

// export default { verifyToken };

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
    role: "",
    userImageUrl: "", // 改為 userImageUrl 存放用戶頭像
  }),
  actions: {
    setUserData(decodedToken) {
      if (!decodedToken) return;
      this.userId = decodedToken.userId;
      this.userName = decodedToken.userName || "未知用户";
      this.role = decodedToken.role;
      localStorage.setItem("userId", this.userId);
      localStorage.setItem("userName", this.userName);
      localStorage.setItem("role", this.role);
      localStorage.setItem("userImageUrl", this.userImageUrl); // 使用 userImageUrl
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
        role: "",
        userImageUrl: "", // 使用 userImageUrl
      };
      Object.assign(this, initialState);
      ["token", "userId", "userName", "role", "userImageUrl"].forEach((key) =>
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
