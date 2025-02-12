<template>
  <n-config-provider :theme="theme">
    <n-global-style />
    <div :class="themeClass" class="app-container">
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
</script>
