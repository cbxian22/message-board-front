<template>
  <n-button @click="handleClick">
    <n-spin v-if="isTouched" size="small" />点我</n-button
  >
</template>

<script setup>
import { ref } from "vue";
import { NButton, NSpin } from "naive-ui";
// const loading = ref(false);
const isTouched = ref(false);

const handleClick = () => {
  //   loading.value = true;
  isTouched.value = true;
  //   setTimeout(() => {
  //     loading.value = false;
  //   }, 2000);
  setTimeout(() => {
    isTouched.value = false;
  }, 5000);
};
</script>

<style></style>
