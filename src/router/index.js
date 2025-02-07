import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore"; // 引入 Pinia 授權管理
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

export default router;
