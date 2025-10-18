import { Rol } from "@/models/Rol";
import { Usuario } from "@/models/Usuario";

// Datos de prueba mientras no hay backend
export const rolesMock: Rol[] = [
{ id: 1, nombre: "Medico" },
{ id: 2, nombre: "Administrador" },
{ id: 3, nombre: "Paciente" },
{ id: 4, nombre: "Asistente" },
];

export const usuariosMock: Usuario[] = [
  /*{
  uid: "3",
  role: 3,
  VA_email: "paciente@gmail.com",
  VA_fotoURL: "x",
  VA_numeroTelefonico: "82345678", 
  BO_emailVerificado: true,
  password: "c3",
  },

  {
  VA_uid: "1",
  IN_FK_role: 1,
  VA_email: "medico@gmail.com",
  VA_fotoURL: "x",
  VA_numeroTelefonico: "88888888", 
  BO_emailVerificado: true,
  password: "a1",
  },

  {
  VA_uid: "2",
  IN_FK_role: 2,
  VA_email: "admin@gmail.com",
  VA_fotoURL: "x",
  VA_numeroTelefonico: "89898989", 
  BO_emailVerificado: true,
  password: "b2",
  },

  {
  VA_uid: "4",
  IN_FK_role: 4,
  VA_email: "asistente@gmail.com",
  VA_fotoURL: "x",
  VA_numeroTelefonico: "81818181", 
  BO_emailVerificado: true,
  password: "d4",
  },*/
];