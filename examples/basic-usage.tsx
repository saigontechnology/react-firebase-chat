"use client";

import React from "react";
import {
  ChatScreen as BasicChatScreen,
  ChatProvider,
  IUser,
  initializeFirebase,
} from "react-firebase-chat";

const firebaseConfig = {
  apiKey: "your-web-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "your-measurement-id",
};

initializeFirebase(firebaseConfig);

export default function ChatRoutePage() {
  // Replace with your user information from your auth system
  const currentUser: IUser = {
    id: "your-user-id",
    name: "your-user-name",
    avatar: "your-user-avatar",
  };

  if (!currentUser) {
    return (
      <div style={{ padding: 24 }}>
        <p>Missing user information. Please go back to the login page.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          height: 1000,
          width: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatProvider currentUser={currentUser}>
          <BasicChatScreen partners={[]} showFileUpload={true} />
        </ChatProvider>
      </div>
    </div>
  );
}
