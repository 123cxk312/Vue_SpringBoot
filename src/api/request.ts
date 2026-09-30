import axios from "axios";
import { getToken,removeToken } from "@/utils/token";
import type {
  AxiosError,
  InternalAxiosRequestConfig
} from "axios";

const request = axios.create({
  baseURL: "/api",
  timeout: 5000,
  // 如果使用 Session/Cookie 登录，需要打开这一行
  withCredentials: false
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 这里返回完整 response，调用处使用 response.data
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        removeToken();

        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }

        // 如果有登录页，可以跳转
        // window.location.href = "/login";
      } else if (status === 403) {
        console.error("没有权限访问");
      } else if (status === 500) {
        console.error("服务器内部错误");
      }
    } else if (error.request) {
      console.error("服务器没有响应，请检查后端是否启动");
    } else {
      console.error("请求配置错误:", error.message);
    }

    return Promise.reject(error);
  }
);

export default request;
