import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";

export const useNavStore = defineStore("nav", () => {
  const authStore = useAuthStore();
  const route = useRoute();
  const activeItem = ref("home");

  const setActive = (item) => {
    activeItem.value = item;
  };

  const syncWithRoute = () => {
    const path = route.path;
    const currentUsername = route.params.accountname;

    console.log("Syncing with route:", path, "accountname:", currentUsername);

    switch (path) {
      case "/":
        activeItem.value = "home";
        break;
      case "/chatlist":
        activeItem.value = "chatlist";
        break;
      case "/login":
        activeItem.value = "login";
        break;
      case "/friendslist":
        activeItem.value = "profile";
        break;
      default:
        if (path.endsWith("navbar")) {
          if (currentUsername && currentUsername === authStore.accountName) {
            activeItem.value = "profile"; // 自己的頁面
          } else {
            activeItem.value = undefined; // 他人的頁面或其他動態路由
          }
        } else {
          activeItem.value = undefined; // 未匹配的路由
        }
        break;
    }
  };

  // 初始同步
  syncWithRoute();

  // 監聽路由變化
  watch(
    () => route.path,
    () => {
      syncWithRoute();
    }
  );

  return { activeItem, setActive, syncWithRoute };
});
