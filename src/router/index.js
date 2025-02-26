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
  scrollBehavior(to, from, savedPosition) {
    const scrollStore = useScrollStore();

    if (to.name === "Home" && from.name === "Profile") {
      const position = scrollStore.getScrollPosition();
      console.log("Returning to Home from Profile, scrollPosition:", position);
      return { top: position, behavior: "auto" }; // 使用 auto 以避免動畫干擾
    }

    if (savedPosition) {
      return savedPosition; // 瀏覽器後退/前進時使用保存的位置
    }

    console.log("Navigating to:", to.name, "with scroll reset to top");
    return { top: 0, behavior: "smooth" };
  },
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const scrollStore = useScrollStore();

  if (from.name === "Home") {
    const position = window.scrollY || document.documentElement.scrollTop;
    scrollStore.setScrollPosition(position);
    console.log("Saving scroll position before leaving Home:", position);
  }

  await nextTick();
  if ((to.name === "Login" || to.name === "Register") && authStore.isLoggedIn) {
    return next({ name: "Home" });
  }
  next();
});

export default router;
