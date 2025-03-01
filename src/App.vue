<template>
  <n-config-provider :theme="theme">
    <div :class="themeClass" class="app-container">
      <n-loading-bar-provider>
        <n-message-provider>
          <n-dialog-provider>
            <n-global-style />
            <router-view />
          </n-dialog-provider>
        </n-message-provider>
      </n-loading-bar-provider>
    </div>
  </n-config-provider>
</template>

<script setup>
import { useThemeStore } from "./stores/themeStore";
import {
  NConfigProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  NMessageProvider,
  NDialogProvider,
} from "naive-ui";
import { computed } from "vue";

// const themeStore = useThemeStore();
// const theme = computed(() => themeStore.theme);

// // 根據主題變更 class
// const themeClass = computed(() =>
//   themeStore.isDarkMode ? "dark-mode" : "light-mode"
// );

// // 確保應用啟動時讀取 localStorage
// onMounted(() => {
//   const savedTheme = localStorage.getItem("theme");
//   if (savedTheme === "dark") {
//     themeStore.setDarkTheme();
//   } else {
//     themeStore.setLightTheme();
//   }
// });
const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);
const themeClass = computed(() =>
  themeStore.isDarkMode ? "dark-mode" : "light-mode"
);
</script>
