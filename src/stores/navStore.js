import { defineStore } from "pinia";
import { ref } from "vue";

export const useNavStore = defineStore("nav", () => {
  const activeItem = ref("home"); // 預設 home

  const setActive = (item) => {
    activeItem.value = item;
  };

  return { activeItem, setActive };
});
