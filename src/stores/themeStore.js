// // stores/themeStore.js
// import { defineStore } from "pinia";
// import { ref } from "vue";
// import { darkTheme, lightTheme } from "naive-ui"; // 引入 darkTheme 和 lightTheme

// export const useThemeStore = defineStore("theme", () => {
//   const theme = ref(darkTheme); // 默認為淺色主題

//   // 設置深色主題
//   const setDarkTheme = () => {
//     theme.value = darkTheme; // 直接修改 theme.value
//     console.log("Dark theme set:", theme.value);
//   };

//   // 設置淺色主題
//   const setLightTheme = () => {
//     theme.value = lightTheme; // 直接修改 theme.value
//     console.log("Light theme set:", theme.value);
//   };

//   return {
//     theme,
//     setDarkTheme,
//     setLightTheme,
//   };
// });
// stores/themeStore.js
import { defineStore } from "pinia";
import { ref, watchEffect, onMounted, onUnmounted } from "vue";
import { darkTheme, lightTheme } from "naive-ui";

export const useThemeStore = defineStore("theme", () => {
  const theme = ref(darkTheme); // 預設為深色主題
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = () => {
    if (prefersDark.matches) {
      theme.value = darkTheme;
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      theme.value = lightTheme;
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  };

  watchEffect(applyTheme);

  onMounted(() => {
    prefersDark.addEventListener("change", applyTheme);
  });

  onUnmounted(() => {
    prefersDark.removeEventListener("change", applyTheme);
  });

  const setDarkTheme = () => {
    theme.value = darkTheme;
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  };

  const setLightTheme = () => {
    theme.value = lightTheme;
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  };

  return {
    theme,
    setDarkTheme,
    setLightTheme,
  };
});
