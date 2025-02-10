<template>
  <transition name="fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <!-- 插槽，讓其他組件插入內容 -->
        <button class="close-btn" @click="close">
          <img
            class="material-symbols-outlined"
            :src="Closeicon"
            alt="Closeicon"
          />
        </button>
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script setup>
import Closeicon from "../assets/Closeicon.svg";

defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false); // 讓 `v-model` 更新
};
</script>

<style scoped>
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0vh;
  left: 0vw;
  z-index: 1000;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-content {
  min-width: 400px;
  border: 1px solid #333;
  border-radius: 8px;
}

.close-btn {
  cursor: pointer;
  position: fixed;
  top: 0;
  right: 0;
  margin: 20px 20px 0px 0;
}

.material-symbols-outlined {
  width: 28px;
}
</style>
