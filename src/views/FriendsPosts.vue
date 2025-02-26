<template>
  <div class="friends-posts">
    <h2>好友貼文</h2>
    <div
      v-for="(comment, index) in comments"
      :key="comment.id"
      :class="[
        'comment-box',
        { 'last-comment': index === comments.length - 1 },
      ]"
    >
      <!-- 頭貼 -->
      <div class="photo-content">
        <img :src="comment.user_avatar" alt="頭像" class="photo" />
      </div>
      <!-- 內文 -->
      <div class="comment">
        <!-- 貼文資訊 -->
        <div class="info">
          <div class="info-span">
            <router-link class="comment-author" :to="`/@${comment.name}`">
              {{ comment.name }}
            </router-link>
            <span class="comment-time">
              {{ dateStore.formatDate(comment.timestamp) }}
            </span>
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
                      authStore.isLoggedIn &&
                      authStore.userName === comment.name
                    "
                  >
                    <button
                      class="modal-link"
                      @click="handleUpdate(comment.id)"
                    >
                      <img class="icon" :src="Editicon" alt="Editicon" />
                      <span>編輯</span>
                    </button>
                  </li>
                  <li
                    v-if="
                      authStore.isLoggedIn &&
                      authStore.userName === comment.name
                    "
                  >
                    <button
                      class="modal-link"
                      @click="handleDelete(comment.id)"
                    >
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
        <!-- 貼文內容 -->
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
        <!-- 回覆功能 -->
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { NBadge } from "naive-ui";
import { useAuthStore } from "../stores/authStore";
import { usePostStore } from "../stores/usePostStore";
import { useDateStore } from "../stores/dateStore";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

import UpdatePostView from "./ModalUpdatePost.vue";
import Replyicon from "../assets/Replyicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import FavoriteRedicon from "../assets/FavoriteRedicon.svg";
import Moreicon from "../assets/Moreicon.svg";
import Editicon from "../assets/Editicon.svg";
import Deleteicon from "../assets/Deleteicon.svg";
import Flagicon from "../assets/Flagicon.svg";

const router = useRouter();
const authStore = useAuthStore();
const postStore = usePostStore();
const dateStore = useDateStore();

const comments = ref([]);
const commentImages = ref([]);
const modalState = ref({});
const modalRefs = ref({});
const buttonRefs = ref({});
const isOpenModal = ref(false);
const isLikeProcessing = ref(false);
const selectedComment = ref(null);

const fetchFriendsPosts = async () => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get("/posts/friends", {
      params: { userId },
    });
    if (response.status === 200 && Array.isArray(response.data)) {
      comments.value = response.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        visibility: comment.visibility,
        name: comment.user_name,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies,
      }));
    } else {
      alert("無法獲取好友貼文，數據格式不正確");
    }
  } catch (error) {
    console.error("取得好友貼文錯誤:", error);
    alert("好友貼文取得失敗，請檢查網絡或稍後再試");
  }
};

// 打開 Modal
const openModal = (event, commentId) => {
  event.stopPropagation();
  if (modalState.value[commentId]) {
    modalState.value[commentId] = false;
    return;
  }
  Object.keys(modalState.value).forEach((key) => {
    modalState.value[key] = false;
  });
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

// 獲取單一貼文
const fetchSingleComment = async (postId) => {
  try {
    const userId = authStore.userId || localStorage.getItem("userId");
    const response = await apiClient.get(`/posts/${postId}`, {
      params: { userId },
    });
    if (response.status === 200) {
      const comment = response.data;
      selectedComment.value = {
        id: comment.id,
        content: comment.content,
        name: comment.user_name,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies,
      };
    }
  } catch (error) {
    console.error("取得單一貼文錯誤:", error);
  }
};

// 刪除留言
const handleDelete = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  try {
    const userId = authStore.userId;
    const message = await postStore.deletePost(postId, userId);
    console.log(message);
    await fetchFriendsPosts(); // 重新獲取好友貼文
  } catch {
    console.log("刪除失敗");
  }
};

// 修改留言
const handleUpdate = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  isOpenModal.value = true;
  await fetchSingleComment(postId);
};

// 新增回覆
const handleReply = async (postId) => {
  if (!authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  await fetchSingleComment(postId);
  router.push({ name: "CommentView", params: { postId } });
};

// 按讚
const handlelike = async (id) => {
  if (!authStore.userId || !authStore.accessToken) {
    alert("請先登入！");
    return;
  }
  if (isLikeProcessing.value) return;

  const comment = comments.value.find((c) => c.id === id);
  if (!comment) return;

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

onMounted(() => {
  fetchFriendsPosts();
  document.addEventListener("mousedown", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", closeModal);
});
</script>

<style scoped>
/* 沿用 InfoSinglePosts.vue 的樣式 */
.friends-posts {
  width: 650px;
  margin: 0 auto;
}

.comment-box {
  padding: 20px 25px 15px 25px;
  border-bottom: 0.5px solid #373737;
  display: flex;
}
.comment-box.last-comment {
  border-bottom: none !important;
}

.photo-content {
  margin-right: 15px;
}

.comment {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.photo {
  border-radius: 50%;
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.reply {
  margin-left: -10px;
}

.reply ul {
  display: flex;
  flex-direction: row;
  list-style-type: none;
}

.reply-count {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 5px;
  margin-right: 10px;
  cursor: pointer;
}

.reply-count .n-badge {
  --n-color: transition !important;
}

.reply-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-count:hover,
.info-link:hover {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.info-span {
  display: flex;
  align-items: center;
}

.info-span .comment-author {
  color: #fff;
  font-weight: 900;
  transition: color 0.3s ease;
}

.info-span .comment-author:hover {
  text-decoration: underline;
}

.light-mode .info-span .comment-author {
  color: #000;
  font-weight: 900;
  transition: color 0.3s ease;
}

.info-span .comment-time {
  margin-left: 10px;
  color: #707070;
}

.info-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
}

.comment-content {
  margin-bottom: 10px;
}

.comment-content p {
  margin-bottom: 10px;
}

.info-modal {
  position: relative;
}

.comment-file {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
}

.comment-file img {
  max-width: 75%;
  height: auto;
  object-fit: cover;
}

.tall-img {
  width: auto;
  max-height: 250px;
}

.dark-mode .modal-overlay {
  background: rgb(24, 24, 24);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode .modal-overlay {
  background: rgb(255, 255, 255);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
