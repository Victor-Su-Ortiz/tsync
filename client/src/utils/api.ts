import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

const API_BASE_URL = EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
