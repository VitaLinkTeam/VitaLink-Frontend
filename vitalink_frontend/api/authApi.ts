import axios from "axios";
import { Usuario } from "@/models/Usuario";

const API_URL = "http://localhost:8080/api/auth"; // Ajusta la URL según tu backend

export const getSession = async (token: string): Promise<Usuario> => {
  const res = await axios.post<{ data: Usuario }>(`${API_URL}/session`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data; // Accede a res.data.data para obtener el Usuario
};

export const signupUser = async (token: string, body: { email: string; roleName: string; name?: string; numeroTelefonico?: string; fotoURL?: string; clinicaId?: number | null }) => {
  const res = await axios.post(`${API_URL}/signup`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const logout = async () => {
  return axios.post(`${API_URL}/logout`);
};