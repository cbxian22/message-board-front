<!-- <template>
  <n-config-provider :theme="theme">
    <div :class="themeClass" class="app-container">
      <n-global-style />
      <router-view />
    </div>
  </n-config-provider>
</template>

<script setup>
import { useThemeStore } from "./stores/themeStore";
import { NConfigProvider, NGlobalStyle } from "naive-ui";
import { computed } from "vue";

const themeStore = useThemeStore();
const theme = computed(() => themeStore.theme);

// 讓 class 根據主題變化
const themeClass = computed(() =>
  theme.value.name === "dark" ? "dark-mode" : "light-mode"
);
</script> -->
<template>
  <n-config-provider :theme="theme">
    <div :class="themeClass" class="app-container">
      <n-global-style />
      <router-view />
    </div>
  </n-config-provider>
</template>

<script setup>
import { useThemeStore } from "./stores/themeStore";
import { NConfigProvider, NGlobalStyle } from "naive-ui";
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
