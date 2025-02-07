<template>
  <div class="not-found">
    <h1>很抱歉，此頁面無法使用。</h1>
    <p>你點擊的連結可能發生故障，或該頁面已遭移除。</p>
    <router-link to="/" class="nav-link">返回 Boardxian。</router-link>
  </div>
</template>

<script setup>
// Logic for NotFound can be added here if needed
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 2rem;
  color: red;
}
</style>
