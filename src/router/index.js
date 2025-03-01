import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useScrollStore } from "@/stores/scrollStore";
import { nextTick } from "vue";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: HomeView,
    },
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
      path: "/chat",
      name: "Chat",
      component: () => import("../views/chat.vue"),
    },
    {
      path: "/@:username",
      name: "Profile",
      component: () => import("../views/ProfileView.vue"),
      props: true,
    },
    {
      path: "/post/:id",
      name: "Post",
      component: () => import("../views/PostView.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("../views/NotFound.vue"),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  await nextTick();
  if ((to.name === "Login" || to.name === "Register") && authStore.isLoggedIn) {
    return next({ name: "Home" });
  }
  next();
});

export default router;
