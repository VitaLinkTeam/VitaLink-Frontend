import axios from "axios";
import { Usuario } from "@/models/Usuario";

const API_URL = "http://localhost:8080/api/auth"; // ajustar url

export const getSession = async (token: string): Promise<Usuario> => {
  const res = await axios.post(`${API_URL}/session`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const signupUser = async (token: string, body: any) => {
  const res = await axios.post(`${API_URL}/signup`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const logout = async () => {
  return axios.post(`${API_URL}/logout`);
};
