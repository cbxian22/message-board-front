<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <div class="container">
      <div class="logo">
        <h1>Boardxian</h1>
      </div>

      <div class="content">
        <h2>註冊即可與好友聯繫</h2>
        <p>加入 Boardxian 即可與大家互動。</p>
      </div>

      <div class="link">
        <router-link to="/login" class="nav-link"
          >使用 Boardxian 帳號繼續</router-link
        >
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { watch } from "vue";
import Modal from "./Modal.vue"; // 引入彈窗組件

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped>
.container {
  padding: 30px;
  width: 350px;
  height: auto;
  background-color: rgb(16, 16, 16);
  border-radius: 8px;
  text-align: center;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
}

.container * {
  background: transparent;
  padding: 10px 0;
}
.content * {
  color: #aaa;
}
.link {
  margin: 10px 0;
  height: auto;
}

.nav-link {
  height: 100%;
  border: 0.5px solid #aaa;
  text-decoration: none;
  font-size: 1rem;
  padding: 15px 25px;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
