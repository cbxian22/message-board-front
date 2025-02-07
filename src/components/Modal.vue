<template>
  <transition name="fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <slot></slot>
        <!-- 插槽，讓其他組件插入內容 -->
        <button class="close-btn" @click="close">關閉</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false); // 讓 `v-model` 更新
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  padding: 20px;
  min-width: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.close-btn {
  margin-top: 10px;
  padding: 5px 10px;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
}
</style>
