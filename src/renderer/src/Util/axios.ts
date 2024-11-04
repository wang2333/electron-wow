import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

// 定义后端通用响应数据结构
export interface ApiResponse {
  success: boolean
  message: string
  data?: any
}

const instance = axios.create({
  baseURL: 'https://wow.syoooo.top',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS'
  },
  withCredentials: true
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 弹框
    return Promise.reject(error)
  }
)

export type ResponseHelper<T = unknown> = {
  success: boolean
  message: string
  data: T
}

export type RequestConfig = Omit<AxiosRequestConfig, 'headers'> & {
  headers?: AxiosRequestConfig['headers']
}

export default function request<T>(
  url: string,
  requestConfig?: RequestConfig
): Promise<AxiosResponse<ResponseHelper<T>>>

export default function request<T>(url: string, config?: RequestConfig): Promise<T>

export default function request<T>(
  url: string,
  requestConfig?: RequestConfig
): Promise<AxiosResponse<ResponseHelper<T>>> {
  return new Promise((resolve, reject) => {
    instance(url, requestConfig)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
