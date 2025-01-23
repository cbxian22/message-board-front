import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AdminPage from "../views/Register.vue"; // 引入管理頁面

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "Home", component: HomeView },
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("../views/Register.vue"),
    },
    {
      path: "/message",
      name: "Message",
      component: () => import("../views/MessageView.vue"),
    },
    {
      path: "/comment/:id",
      name: "Comment",
      component: () => import("../views/CommentView.vue"),
      props: true, // 允許將路由參數作為 props 傳遞
    },
    {
      path: "/admin",
      name: "Admin",
      component: AdminPage, // 管理員頁面
      beforeEnter: (to, from, next) => {
        const user = localStorage.getItem("user");
        if (user === "admin") {
          next();
        } else {
          next({ name: "Home" }); // 若不是管理員，重定向至首頁
        }
      },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("../views/NotFound.vue"),
    },
  ],
});

// 設置導航守衛
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token"); // 檢查是否有 token
  if (to.meta.requiresAuth && !token) {
    alert("請先登入！");
    next("/login"); // 如果沒有 token，跳轉到登入頁
  } else {
    next(); // 繼續導航
  }
});

export default router;
