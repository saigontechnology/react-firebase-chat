import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const statusConfig = {
    connected: {
        icon: '●',
        text: 'Connected',
        className: 'text-green-500',
    },
    connecting: {
        icon: '●',
        text: 'Connecting...',
        className: 'text-yellow-500',
    },
    disconnected: {
        icon: '●',
        text: 'Disconnected',
        className: 'text-red-500',
    },
    error: {
        icon: '●',
        text: 'Connection Error',
        className: 'text-red-600',
    },
};
export const ConnectionStatus = ({ status, className = '', }) => {
    const config = statusConfig[status];
    return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: `flex items-center space-x-2 text-xs ${className}`, children: [_jsx(motion.span, { className: `${config.className}`, animate: status === 'connecting' ? { opacity: [1, 0.3, 1] } : {}, transition: {
                    duration: 1,
                    repeat: status === 'connecting' ? Infinity : 0,
                }, children: config.icon }), _jsx("span", { className: config.className, children: config.text })] }));
};
//# sourceMappingURL=ConnectionStatus.js.map