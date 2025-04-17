import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ElMessage } from "element-plus"; // 使用 element-plus 替代 element-ui
import axiosExtra from "axios-extra";

const baseUrl = `http://${window.location.hostname}:8080`;

// 基础 Axios 实例
const http: AxiosInstance = axios.create({
  baseURL: baseUrl,
});

// 请求拦截器 - 自动添加 Authorization
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 从 localStorage 获取 password
    const password = localStorage.getItem("password");
    if (config.headers) {
      config.headers["Authorization"] = password ? password : "";
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 配置拦截器，返回 response.data
http.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      if (response.data && response.data.code !== 200) {
        ElMessage.error(response.data.msg || "请求失败"); // 使用 ElMessage 替代 Message
      }
      return response.data;
    } catch (error) {
      console.error("拦截器错误:", error);
      ElMessage.error("服务器响应解析失败");
      return Promise.reject(error);
    }
  },
  (error: any) => {
    console.error("请求错误:", error);
    ElMessage.error(error.response?.data?.msg || "网络错误，请稍后重试");
    return Promise.reject(error);
  }
);

// 配置 axios-extra 实例，用于控制并发和重试
const httpExtra: any = axiosExtra.create({
  maxConcurrent: 5, // 并发数为 5
  queueOptions: {
    retry: 3, // 请求失败时最多重试 3 次
    retryIsJump: false, // 重试时插入队列尾部而非立即重试
  },
});

httpExtra.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const password = localStorage.getItem("password");
    if (config.headers && password) {
      config.headers["Authorization"] = password;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

export { http, baseUrl, httpExtra };
