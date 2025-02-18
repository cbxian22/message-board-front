import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore"; // 引入 Pinia 授權管理
import { nextTick } from "vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: HomeView,
      // meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/LoginView.vue"),
      // meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("../views/Register.vue"),
      // meta: { requiresGuest: true },
    },
    {
      path: "/message",
      name: "Message",
      component: () => import("../components/MessageView.vue"),
      // meta: { requiresGuest: true },
    },
    {
      path: "/chat",
      name: "Chat",
      component: () => import("../views/ChatView.vue"),
      // meta: { requiresGuest: true },
    },
    {
      path: "/@:username",
      name: "Profile",
      component: () => import("../views/Profile.vue"),
      props: true, // 將路由參數作為 props 傳遞給 Profile.vue
    },
    {
      path: "/comment/:id",
      name: "Comment",
      component: () => import("../views/CommentView.vue"),
      props: true, // 允許將路由參數作為 props 傳遞
      // meta: { requiresGuest: true },
    },

    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("../views/NotFound.vue"),
    },
  ],
});

// 路由守衛：進入頁面前檢查登入狀態
// 已開放為登入者瀏覽，所以註解！！！
// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore();
//   console.log("Navigating to:", to.path); // 顯示正在跳轉的路徑
//   console.log("Route meta:", to.meta); // 顯示路由的 meta 設置

//   // 如果需要登入的頁面且未登入
//   if (to.meta.requiresAuth && !authStore.isLoggedIn) {
//     console.log("未登入，跳轉到 /login");
//     next("/login"); // 如果未登入，跳轉到登入頁
//   }
//   // 如果需要未登入用戶訪問的頁面，且用戶已登入
//   else if (to.meta.requiresGuest && authStore.isLoggedIn) {
//     console.log("已登入，跳轉到首頁");
//     next("/"); // 如果已登入，跳轉到首頁
//   } else {
//     next(); // 其他情況，繼續進行導航
//   }
// });

// 如果已登入者訪問 Login 或 Register 頁面，重定向到首頁
// router.beforeEach(async (to, from, next) => {
//   const authStore = useAuthStore();

//   // 等待 Vue 完成所有更新（包括 Pinia 狀態）後再進行導航
//   await nextTick();

//   console.log("Checking auth status:", authStore.isLoggedIn); // 確認最新的登入狀態

//   // 如果已登入且正在訪問 Login 或 Register 頁面，重定向到首頁
//   if ((to.name === "Login" || to.name === "Register") && authStore.isLoggedIn) {
//     console.log("已登入，跳轉到首頁");
//     return next({ name: "Home" }); // 已登入的使用者跳轉到首頁
//   }

//   next(); // 其他情況正常導航
// });
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 等待 Vue 完成所有更新（包括 Pinia 狀態）後再進行導航
  await nextTick();

  console.log("Checking auth status:", authStore.isLoggedIn); // 確認最新的登入狀態

  // 如果已登入且正在訪問 Login 或 Register 頁面，重定向到首頁
  if ((to.name === "Login" || to.name === "Register") && authStore.isLoggedIn) {
    console.log("已登入，跳轉到首頁");
    return next({ name: "Home" }); // 已登入的使用者跳轉到首頁
  }

  // 檢查是否訪問自己的頁面，並且正在導航到其他頁面
  if (authStore.isLoggedIn && to.params.username !== authStore.userName) {
    console.log("跳轉到自己的頁面");
    return next(`/@${authStore.userName}`); // 重定向到自己的頁面
  }

  next(); // 其他情況正常導航
});

export default router;
