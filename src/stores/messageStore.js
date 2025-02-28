// src/stores/messageStore.js
import { defineStore } from "pinia";
import { useMessage } from "naive-ui";

export const useMessageStore = defineStore("message", () => {
  const getMessage = () => {
    try {
      const message = useMessage();
      if (!message || typeof message.error !== "function") {
        console.error("useMessage 返回的物件無效:", message);
        return null;
      }
      return message;
    } catch (error) {
      console.error("無法初始化 useMessage:", error);
      return null;
    }
  };

  const showInfo = (customInfo) => {
    const message = getMessage();
    if (message) {
      message.info(customInfo || "This is a customMessage.", {
        keepAliveOnHover: true,
      });
    } else {
      console.warn("無法顯示 info，因 message 未初始化");
    }
  };

  const showError = (customError) => {
    const message = getMessage();
    if (message) {
      message.error(customError || "This is a customMessage.");
    } else {
      console.warn("無法顯示 error，因 message 未初始化");
    }
  };

  const showWarning = (customWarning) => {
    const message = getMessage();
    if (message) {
      message.warning(customWarning || "This is a customWarning.");
    } else {
      console.warn("無法顯示 warning，因 message 未初始化");
    }
  };

  const showSuccess = (customMessage) => {
    const message = getMessage();
    if (message) {
      message.success(customMessage || "This is a showSuccess.");
    } else {
      console.warn("無法顯示 success，因 message 未初始化");
    }
  };

  const showLoading = (customLoading) => {
    const message = getMessage();
    if (message) {
      message.loading(customLoading || "This is a customLoading.");
    } else {
      console.warn("無法顯示 loading，因 message 未初始化");
    }
  };

  return {
    showInfo,
    showError,
    showWarning,
    showSuccess,
    showLoading,
  };
});
