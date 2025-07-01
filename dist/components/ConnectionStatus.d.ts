import React from 'react';
import { ConnectionStatus as Status } from '../types';
interface ConnectionStatusProps {
    status: Status;
    className?: string;
}
export declare const ConnectionStatus: React.FC<ConnectionStatusProps>;
export {};
