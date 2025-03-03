// import { defineStore } from "pinia";
// import { ref } from "vue";

// export const useNavStore = defineStore("nav", () => {
//   const activeItem = ref("home"); // 預設 home

//   const setActive = (item) => {
//     activeItem.value = item;
//   };

//   return { activeItem, setActive };
// });
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";

export const useNavStore = defineStore("nav", () => {
  const authStore = useAuthStore();
  const route = useRoute();
  const activeItem = ref("home"); // 預設 home

  const setActive = (item) => {
    activeItem.value = item;
  };

  // 監聽路由變化並更新 activeItem
  const syncWithRoute = () => {
    const path = route.path;
    const currentUsername = route.params.username;
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
      case `/@${authStore.userName}`:
        activeItem.value = "profile";
        break;
      default:
        // 處理動態路由 /@[username]
        if (path.startsWith("/@")) {
          if (currentUsername === authStore.userName) {
            // 如果是自己的頁面，高亮 "profile"
            activeItem.value = "profile";
          } else {
            // 如果是別人的頁面，取消高亮
            activeItem.value = undefined;
          }
        } else {
          // 其他未匹配的路由，取消高亮
          activeItem.value = undefined;
        }
        break;
    }
  };

  // 初始同步
  syncWithRoute();

  // 返回狀態和方法
  return { activeItem, setActive, syncWithRoute };
});
