import { Usuario } from "@/models/Usuario";

export interface Doctor extends Usuario {
     especializacionId: number; 
}