import express from 'express';

declare module 'express' {
    interface Request {
        user?: {
            user_id: string;
            username: string;
        };
    }
}