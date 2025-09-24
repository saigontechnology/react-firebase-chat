"use client";

import React, { useEffect, useMemo, useState } from "react";
import { initializeFirebase, IUser, UserService } from "react-firebase-chat";

const firebaseConfig = {
  apiKey: "your-web-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

initializeFirebase(firebaseConfig);

export default function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: IUser) => void;
}) {
  const userService = useMemo(() => UserService.getInstance(), []);
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [newUserId, setNewUserId] = useState<string>("");
  const [newUserName, setNewUserName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const list = await userService.getAllUsers();
        if (isMounted) setUsers(list as IUser[]);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load users");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [userService]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserName.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      await userService.createUserIfNotExists(newUserId.trim(), {
        name: newUserName.trim(),
      });
      const created: IUser = { id: newUserId.trim(), name: newUserName.trim() };
      onAuthenticated(created);
    } catch (e: any) {
      setError(e?.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: IUser) => {
    onAuthenticated(user);
  };

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Authenticate</h3>
        <p style={{ color: "#555", marginTop: 4 }}>
          Create a new user or pick an existing one.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: "#b00020" }}>{error}</div>
      )}

      <form
        onSubmit={handleCreate}
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <input
          placeholder="New user ID"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          style={{
            flex: 2,
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <input
          placeholder="New user name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          style={{
            flex: 3,
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            border: 0,
          }}
        >
          {isLoading ? "Creating..." : "Create user"}
        </button>
      </form>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Or sign in as existing user
        </div>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {isLoading && users.length === 0 ? (
            <div style={{ padding: 12 }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 12, color: "#666" }}>No users found.</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {users.map((u) => (
                <li key={u.id} style={{ borderTop: "1px solid #f3f3f3" }}>
                  <button
                    onClick={() => handleSelect(u)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      textAlign: "left",
                      padding: 12,
                      background: "#fff",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    <span>{u.name || u.id}</span>
                    <span style={{ color: "#999" }}>{u.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
