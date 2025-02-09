import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MatchConfirmationToast = ({ sender, matchId, onAccept }) => {
  return (
    <div>
      <p>{sender} desafiou você para uma partida!</p>
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
      </div>
    </div>
  );
};

export default MatchConfirmationToast;
