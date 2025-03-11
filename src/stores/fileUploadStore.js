import { defineStore } from "pinia";
import { ref } from "vue";

export const useFileUploadStore = defineStore("fileUpload", () => {
  const files = ref({});

  const getFileType = (fileOrUrl) => {
    if (typeof fileOrUrl === "string") {
      const ext = fileOrUrl.split(".").pop().toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
        return "image";
      if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
    } else if (fileOrUrl?.type) {
      if (fileOrUrl.type.startsWith("image/")) return "image";
      if (fileOrUrl.type.startsWith("video/")) return "video";
    }
    return null;
  };

  const triggerFileInput = (instanceId, authStore, fileInputRef) => {
    if (!authStore.userId || !authStore.accessToken) {
      emitter.emit("openLoginModal");
    } else {
      fileInputRef?.click();
    }
  };

  const handleFileUpload = (instanceId, event, message) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (files.value[instanceId]?.fileUrl)
      URL.revokeObjectURL(files.value[instanceId].fileUrl);
    files.value[instanceId] = { file: selectedFile, fileUrl: null };

    try {
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          files.value[instanceId].fileUrl = e.target.result;
        };
        reader.onerror = () => {
          message.error("圖片讀取失敗！");
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith("video/")) {
        files.value[instanceId].fileUrl = URL.createObjectURL(selectedFile);
      } else {
        files.value[instanceId] = null;
        message.error("僅支援圖片和影片檔案！");
      }
    } catch (error) {
      files.value[instanceId] = null;
      message.error("檔案處理失敗，請重試！");
    }
  };

  const cancelFilePreview = (instanceId) => {
    if (files.value[instanceId]?.fileUrl)
      URL.revokeObjectURL(files.value[instanceId].fileUrl);
    files.value[instanceId] = null;
  };

  const cleanup = (instanceId) => {
    if (files.value[instanceId]?.fileUrl)
      URL.revokeObjectURL(files.value[instanceId].fileUrl);
    files.value[instanceId] = null;
  };

  const getFile = (instanceId) => files.value[instanceId]?.file || null;
  const getFileUrl = (instanceId) => files.value[instanceId]?.fileUrl || null;
  const isPreviewImage = (instanceId) =>
    getFileType(getFile(instanceId)) === "image";
  const isPreviewVideo = (instanceId) =>
    getFileType(getFile(instanceId)) === "video";

  return {
    files,
    getFileType,
    triggerFileInput,
    handleFileUpload,
    cancelFilePreview,
    cleanup,
    getFile,
    getFileUrl,
    isPreviewImage,
    isPreviewVideo,
  };
});
