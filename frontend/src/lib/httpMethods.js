import axiosInstance from "./axiosInstance";

export const get = async (url, config = {}) => {
  const res = await axiosInstance.get(url, config);
  return res;
};

export const post = async (url, data = {}, config = {}) => {
  const res = await axiosInstance.post(url, data, config);
  return res;
};

export const put = async (url, data = {}, config = {}) => {
  const res = await axiosInstance.put(url, data, config);
  return res;
};

export const patch = async (url, data = {}, config = {}) => {
  const res = await axiosInstance.patch(url, data, config);
  return res;
};

export const del = async (url, config = {}) => {
  const res = await axiosInstance.delete(url, config);
  return res;
};
