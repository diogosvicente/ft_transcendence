let API_LANGUAGE = localStorage.getItem("language") || "en";

export const setApiLanguage = (language) => {
  API_LANGUAGE = language;
  localStorage.setItem("language", language);
};

export const API_BASE_URL = "https://192.168.1.138";

export const DEFAULT_AVATAR = `/media/avatars/default.png`;

export const getAvatar = (avatarPath) => {
  if (!avatarPath || avatarPath === "/media/") {
    return DEFAULT_AVATAR;
  }

  return avatarPath.startsWith("/media/")
    ? ``
    : `/media/`;
};


export const getWsUrl = (path = "") => {
  return "wss://192.168.1.138" + path;  // e.g. /ws/chat/
};

export default API_BASE_URL;