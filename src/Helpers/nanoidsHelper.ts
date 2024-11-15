import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const NANOID = customAlphabet(alphabet, 6);