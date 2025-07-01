import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
const TypingDots = () => (_jsx("div", { className: "flex space-x-1", children: [0, 1, 2].map((i) => (_jsx(motion.div, { className: "w-2 h-2 bg-gray-400 rounded-full", animate: {
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
        }, transition: {
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
        } }, i))) }));
export const TypingIndicator = ({ typingUsers, className = '', }) => {
    if (typingUsers.length === 0)
        return null;
    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].displayName} is typing`;
        }
        else if (typingUsers.length === 2) {
            return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`;
        }
        else {
            return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`;
        }
    };
    return (_jsx(AnimatePresence, { children: _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, className: `flex items-center space-x-2 text-sm text-gray-500 px-4 py-2 ${className}`, children: [_jsx(TypingDots, {}), _jsx("span", { className: "italic", children: getTypingText() })] }) }));
};
//# sourceMappingURL=TypingIndicator.js.map