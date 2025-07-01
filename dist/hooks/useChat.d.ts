import { UseChatReturn } from '../types';
export interface UseChatProps {
    userId: string;
    conversationId?: string;
}
export declare const useChat: ({ userId, conversationId }: UseChatProps) => UseChatReturn;
