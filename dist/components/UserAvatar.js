import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
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
export const UserAvatar = ({ user, size = 'medium', showOnlineStatus = true, className, }) => {
    const initials = user.displayName
        ? user.displayName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';
    const isOnline = user.isOnline && user.status === 'online';
    return (_jsxs("div", { className: clsx('relative inline-block', className), children: [_jsx("div", { className: clsx('rounded-full flex items-center justify-center font-medium text-white bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden', sizeClasses[size]), children: user.photoURL ? (_jsx("img", { src: user.photoURL, alt: user.displayName, className: "w-full h-full object-cover", onError: (e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target;
                        target.style.display = 'none';
                    } })) : (_jsx("span", { children: initials })) }), showOnlineStatus && (_jsx("div", { className: clsx('absolute rounded-full border-2 border-white', onlineStatusClasses[size], isOnline ? 'bg-green-500' : 'bg-gray-400'), title: isOnline ? 'Online' : 'Offline' }))] }));
};
//# sourceMappingURL=UserAvatar.js.map