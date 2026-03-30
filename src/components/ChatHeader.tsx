import React from 'react';
import { UserAvatar } from './UserAvatar';

export interface ChatHeaderProps {
  currentUser: { id: string | number; name?: string; avatar?: string } | null;
  onLogout?: () => void;
  rightExtras?: React.ReactNode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ currentUser, onLogout: _onLogout, rightExtras }) => {
  return (
    <div className="app-header">
      <div className="header-left" />
      <div className="header-center">
        {/* Logo placeholder */}
      </div>
      <div className="header-right">
        <div className="profile">
          <UserAvatar user={currentUser as any} />
          <span className="profile-name">{currentUser?.name || 'Me'}</span>
        </div>
        {rightExtras}
      </div>
    </div>
  );
};

export default ChatHeader;


