import React from 'react';
import { clsx } from 'clsx';
import { UserAvatarProps } from '../types';

const sizeClasses = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-12 h-12 text-sm',
  large: 'w-16 h-16 text-lg',
};

const onlineStatusClasses = {
  small: 'w-2 h-2 bottom-0 right-0',
  medium: 'w-3 h-3 bottom-0.5 right-0.5',
  large: 'w-4 h-4 bottom-1 right-1',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'small',
  className,
}) => {
  const initials = user.name
    ? user.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : '?';

  const isOnline = true;

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-medium text-white bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden',
          sizeClasses[size]
        )}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
};
