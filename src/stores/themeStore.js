// stores/themeStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { darkTheme, lightTheme } from "naive-ui";

export const useThemeStore = defineStore("theme", () => {
  // 讀取 localStorage，預設為 'dark'
  const savedTheme = localStorage.getItem("theme") || "dark";
  const isDarkMode = ref(savedTheme === "dark");
  const theme = ref(isDarkMode.value ? darkTheme : lightTheme);

  // 設置深色主題
  const setDarkTheme = () => {
    theme.value = darkTheme;
    isDarkMode.value = true;
    localStorage.setItem("theme", "dark");
  };

  // 設置淺色主題
  const setLightTheme = () => {
    theme.value = lightTheme;
    isDarkMode.value = false;
    localStorage.setItem("theme", "light");
  };

  return {
    theme,
    isDarkMode, // 用來控制開關狀態
    setDarkTheme,
    setLightTheme,
  };
});
