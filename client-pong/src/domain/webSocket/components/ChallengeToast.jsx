import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChallengeToast = ({ sender, matchId, onAccept, onDecline }) => {
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
          Aceitar
        </button>
        <button
          onClick={() => {
            onDecline(matchId);
            toast.dismiss();
          }}
        >
          Recusar
        </button>
      </div>
    </div>
  );
};

export default ChallengeToast;
