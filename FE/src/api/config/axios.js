import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error("VITE_API_URL is not defined in environment variables");
}

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const chatSessionIdKey = "chatSessionId";
        let sid = localStorage.getItem(chatSessionIdKey);
        if (!sid) {
            sid = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
            localStorage.setItem(chatSessionIdKey, sid);
        }
        config.headers["x-session-id"] = sid;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            const message = error.response.data?.message || "Đã xảy ra lỗi";
            const status = error.response.status;
            const customError = new Error(message);
            customError.response = error.response;
            customError.status = status;
            return Promise.reject(customError);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

