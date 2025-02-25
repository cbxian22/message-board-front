<!-- <script setup>
import { ref, defineEmits, onMounted, onUnmounted } from "vue";
import { NBadge } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { usePostStore } from "../stores/usePostStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig"; // 引入 apiClient

import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";
import UpdatePostView from "./ModalUpdatePost.vue";

const router = useRouter();
const emit = defineEmits();
const postStore = usePostStore();
const authStore = useAuthStore();
const dateStore = useDateStore();

const comments = ref([]);
const commentImages = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false); // 用於追踪點讚狀態
const selectedComment = ref(null); // 用於儲存當前選中的單一留言

// 打開 Modal
const openModal = (event, commentId) => {
  event.stopPropagation();

  // 如果當前 Modal 已開啟，則關閉它
  if (modalState.value[commentId]) {
    modalState.value[commentId] = false;
    return;
  }

  // 先關閉所有其他留言的 Modal
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });

  // 只打開當前點擊的留言的 Modal
  modalState.value[commentId] = true;
};

// 關閉 Modal
const closeModal = (event) => {
  const clickedInsideModal = Object.keys(modalRefs.value).some((id) => {
    const modal = modalRefs.value[id];
    const button = buttonRefs.value[id];

    return (
      modal && (modal.contains(event.target) || button.contains(event.target))
    );
  });

  if (!clickedInsideModal) {
    Object.keys(modalState.value).forEach((key) => {
      modalState.value[key] = false;
    });
  }
};

onMounted(() => {
  document.addEventListener("mousedown", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});

// 獲取留言
const fetchComments = async () => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get("/posts", { params: { userId } });
    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        name: comment.user_name,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false, // 後端返回的用戶是否點贊
        replies: comment.replies,
      }));
      emit("loaded");
    } else {
      alert("無法獲取留言，數據格式不正確");
    }
  } catch (error) {
    console.error("取得留言錯誤:", error);
    alert("留言取得失敗，請檢查網絡或稍後再試");
  }
};

// 刪除留言
const handleDelete = async (postId) => {
  try {
    const userId = authStore.userId;
    const message = await postStore.deletePost(postId, userId);
    console.log(message);
    location.reload();
  } catch (error) {
    console.error("刪除失敗:", error.message);
    alert("刪除失敗: " + error.message); // 顯示具體錯誤訊息
  }
};

// 修改留言
const handleUpdate = async (postId) => {
  isOpenModal.value = true;
  await fetchSingleComment(postId); // 獲取單一留言
};

// 按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    return;
  }

  if (isLikeProcessing.value) {
    console.log("點讚操作正在進行中，忽略此次請求");
    return;
  }

  // 找到對應的 comment
  const comment = comments.value.find((c) => c.id === id);
  if (!comment) return;

  // 樂觀更新 UI（假設點讚成功）
  const previousLikes = comment.likes;
  const previousUserLiked = comment.userLiked;

  if (!comment.userLiked) {
    comment.likes += 1;
    comment.userLiked = true;
  } else {
    comment.likes = Math.max(comment.likes - 1, 0);
    comment.userLiked = false;
  }

  isLikeProcessing.value = true;

  try {
    const response = await apiClient.post(`/like/${authStore.userId}`, {
      targetType: "post",
      targetId: id,
    });
    if (response.status === 200 && response.data.likesCount !== undefined) {
      comment.likes = response.data.likesCount;
    }
  } catch (error) {
    console.error(
      "提交錯誤:",
      error.response ? error.response.data.error : error.message
    );
    comment.likes = previousLikes;
    comment.userLiked = previousUserLiked;
  } finally {
    isLikeProcessing.value = false;
  }
};

// 頁面加載時執行
onMounted(() => {
  fetchComments();
});

// 確保對每一個圖片都加載後進行判斷
onMounted(() => {
  commentImages.value.forEach((img) => {
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth) {
        img.classList.add("tall-img"); // 直向圖片加上類別
      }
    };
  });
});
</script>

<template>
  <div
    v-for="(comment, index) in comments"
    :key="comment.id"
    :class="['comment-box', { 'last-comment': index === comments.length - 1 }]"
  >
    <div class="photo-content">
      <img :src="comment.user_avatar" alt="頭像" class="photo" />
    </div>

    <div class="comment">
      <div class="info">
        <div class="info-span">
          <router-link class="comment-author" :to="`/@${comment.name}`">
            {{ comment.name }}
          </router-link>

          <span class="comment-time">
            {{ dateStore.formatDate(comment.timestamp) }}</span
          >
        </div>

        <div class="info-modal">
          <button
            ref="buttonRefs"
            @click="openModal($event, comment.id)"
            class="info-link"
          >
            <img class="icon" :src="Moreicon" alt="Moreicon" />
          </button>
          <div
            v-show="modalState[comment.id]"
            class="modal-overlay"
            ref="modalRefs"
          >
            <div class="modal-content" @click.stop>
              <ul>
                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === comment.name
                  "
                >
                  <button class="modal-link" @click="handleUpdate(comment.id)">
                    <img class="icon" :src="Editicon" alt="Editicon" />
                    <span>編輯</span>
                  </button>
                </li>

                <li
                  v-if="
                    authStore.isLoggedIn && authStore.userName === comment.name
                  "
                >
                  <button class="modal-link" @click="handleDelete(comment.id)">
                    <img class="icon" :src="Deleteicon" alt="Deleteicon" />
                    <span>刪除</span>
                  </button>
                </li>
                <li v-if="authStore.userName !== comment.name">
                  <button class="modal-link">
                    <img class="icon" :src="Flagicon" alt="Flagicon" />
                    <span>檢舉</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-content">
        <p>{{ comment.content }}</p>
        <span v-if="comment.file_url" class="comment-file">
          <img
            :src="comment.file_url"
            alt="comment.file_url"
            ref="commentImages"
          />
        </span>
      </div>

      <div class="reply">
        <ul>
          <li>
            <div class="reply-count" @click="handlelike(comment.id)">
              <button class="reply-link">
                <img
                  :class="{ icon: !comment.userLiked }"
                  :src="comment.userLiked ? FavoriteRedicon : Favoriteicon"
                  alt="Like"
                />
              </button>
              <n-badge :value="comment.likes || 0" />
            </div>
          </li>
          <li>
            <div class="reply-count" @click="handleReply(comment.id)">
              <button class="reply-link">
                <img class="icon" :src="Replyicon" alt="Replyicon" />
              </button>
              <n-badge :value="comment.replies || 0" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <UpdatePostView v-model="isOpenModal" :comment="selectedComment" />
</template> -->
