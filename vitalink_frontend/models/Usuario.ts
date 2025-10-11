

export interface Usuario {
  uid: string;
  email: string;
  fotoURL?: string;
  numeroTelefonico?: string;
  emailVerificado?: boolean;
  roleName?: string;
  clinicaId?: number | null;
  existsInDb?: boolean;
}

/*export interface Usuario {
  VA_uid: string;
  IN_FK_role: number;
  VA_email: string;
  VA_fotoURL: string;
  VA_numeroTelefonico: string;
  BO_emailVerificado: boolean;
  password: string;
}*/