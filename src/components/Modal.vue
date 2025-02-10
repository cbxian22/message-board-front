<template>
  <transition name="fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <button class="close-btn" @click="close">
        <img
          class="material-symbols-outlined"
          :src="Closeicon"
          alt="Closeicon"
        />
      </button>

      <slot><!-- 插槽，讓其他組件插入內容 --></slot>
    </div>
  </transition>
</template>

<script setup>
import { watch } from "vue";
import Closeicon from "../assets/Closeicon.svg";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false); // 讓 `v-model` 更新
};

// 監聽 `props.modelValue`，控制 body 滾動
watch(
  () => props.modelValue, // 這裡要監聽 `props.modelValue`
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = "hidden"; // 禁止滾動
    } else {
      document.body.style.overflow = ""; // 恢復滾動
    }
  },
  { immediate: true } // 立即執行一次，確保初始狀態同步
);
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
