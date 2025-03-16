import React from "react";

const ProfileHeader = ({ user, avatar }) => {
  return (
    <div className="profile-header">
      <img
        src={avatar}
        alt={user.display_name}
        className="profile-avatar"
      />
      <h1>{user.display_name}</h1>
      <p>
        <span
          style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: user.online_status ? "green" : "red",
            marginRight: "8px",
          }}
        ></span>
        {user.online_status ? "Online" : "Offline"}
      </p>
    </div>
  );
};

export default ProfileHeader;
