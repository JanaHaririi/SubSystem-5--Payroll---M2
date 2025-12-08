// utils/axiosInstance.ts
"use client";
import axios from 'axios';
import { redirect } from 'next/navigation';
const axiosInstance = axios.create({
  baseURL: "http://localhost:4000", // Backend NestJS server
  withCredentials: true, // Include cookies if needed

})
// This variable will hold the function that AuthContext gives us
let onUnAuthenticated: (() => void);
// AuthContext will call this later
export function registerUnauthenticatedHandler(handler: () => void) {
  onUnAuthenticated = handler;
}
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    console.log('error status', status);
    if (status === 403 && !window.location.href.includes('/login')
      && !window.location.href.includes('/register')) {
      redirect('/unauthorized')
    }
    if ((status === 401) && !window.location.href.includes('/login')
       && !window.location.href.includes('/register')) {
      onUnAuthenticated();

    }
    return Promise.reject(error);
  }
);

export default axiosInstance;