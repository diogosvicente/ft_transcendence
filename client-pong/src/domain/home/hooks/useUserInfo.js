import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../assets/config/config.js";

const useUserInfo = () => {
  const [displayName, setDisplayName] = useState("Jogador");

  useEffect(() => {
    const userId = localStorage.getItem("id");
    const accessToken = localStorage.getItem("access");

    if (userId && accessToken) {
      axios
        .get(`${API_BASE_URL}/api/user-management/user-info/${userId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const data = response.data;
          setDisplayName(data.display_name || "Jogador");
        })
        .catch((error) => {
          console.error("Erro ao buscar o display_name:", error);
          setDisplayName("Jogador");
        });
    }
  }, []);

  return displayName;
};

export default useUserInfo;
