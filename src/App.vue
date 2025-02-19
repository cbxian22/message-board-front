<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <div :class="themeClass" class="app-container">
        <n-global-style />
        <router-view />
      </div>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup>
import { useThemeStore } from "./stores/themeStore";
import { NConfigProvider, NGlobalStyle, NLoadingBarProvider } from "naive-ui";
import { computed, onMounted } from "vue";

const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);

// 根據主題變更 class
const themeClass = computed(() =>
  themeStore.isDarkMode ? "dark-mode" : "light-mode"
);

// 確保應用啟動時讀取 localStorage
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    themeStore.setDarkTheme();
  } else {
    themeStore.setLightTheme();
  }
});
</script>
