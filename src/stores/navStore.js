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
      case `/@${authStore.userName}, query: { from: 'navbar' }`:
        activeItem.value = "profile";
        break;
      default:
        activeItem.value = undefined; // 如果路由不匹配任何導航項，清除高亮
    }
  };

  // 初始同步
  syncWithRoute();

  // 返回狀態和方法
  return { activeItem, setActive, syncWithRoute };
});
