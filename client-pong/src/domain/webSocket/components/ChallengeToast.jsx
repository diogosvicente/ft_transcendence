import React from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import "react-toastify/dist/ReactToastify.css";

const ChallengeToast = ({ sender, matchId, onAccept, onDecline }) => {
  const { t } = useTranslation();

  return (
    <div>
      <p>{sender}</p>  {/*desafiou você para uma partida! [REMOVIDO] */}
      <div>
        <button
          onClick={() => {
            onAccept(matchId);
            toast.dismiss();
          }}
          style={{ marginRight: "10px" }}
        >
          {t("toast.accept")}
        </button>
        <button
          onClick={() => {
            onDecline(matchId);
            toast.dismiss();
          }}
        >
          {t("toast.decline")}
        </button>
      </div>
    </div>
  );
};

export default ChallengeToast;
