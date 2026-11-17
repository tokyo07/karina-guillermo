// Generado desde el esquema real del proyecto Supabase de esta invitación
// (karina-guillermo-invitacion). Si cambiás la tabla `rsvps`, regenerá este
// archivo con `supabase gen types typescript` o el equivalente del MCP.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      rsvps: {
        Row: {
          acompanantes: number;
          asiste: boolean;
          created_at: string;
          id: number;
          mensaje: string | null;
          nombre: string;
        };
        Insert: {
          acompanantes?: number;
          asiste: boolean;
          created_at?: string;
          id?: never;
          mensaje?: string | null;
          nombre: string;
        };
        Update: {
          acompanantes?: number;
          asiste?: boolean;
          created_at?: string;
          id?: never;
          mensaje?: string | null;
          nombre?: string;
        };
        Relationships: [];
      };
      // Álbum (sql/album.sql). Escrito a mano siguiendo la migración;
      // regenerar con `supabase gen types typescript` cuando esté aplicada.
      fotos: {
        Row: {
          id: string;
          public_id: string;
          ancho: number;
          alto: number;
          nombre: string;
          momento: string;
          reto: string | null;
          oculta: boolean;
          revisar: boolean;
          motivo: string | null;
          calidad: Json | null;
          creada_en: string;
        };
        Insert: never;
        Update: {
          oculta?: boolean;
          revisar?: boolean;
        };
        Relationships: [];
      };
      novios: {
        Row: { user_id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      album_ajustes: {
        Row: {
          id: boolean;
          subidas_abiertas: boolean;
          max_subidas_por_hora: number;
          momento_actual: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      es_novio: { Args: Record<string, never>; Returns: boolean };
      subir_foto: {
        Args: {
          p_public_id: string;
          p_ancho: number;
          p_alto: number;
          p_nombre: string;
          p_momento: string;
          p_reto: string | null;
          p_dispositivo: string;
          p_motivo?: string | null;
          p_calidad?: Json | null;
        };
        Returns: string;
      };
      listar_fotos: {
        Args: { p_dispositivo?: string | null };
        Returns: {
          id: string;
          public_id: string;
          ancho: number;
          alto: number;
          nombre: string;
          momento: string;
          reto: string | null;
          oculta: boolean;
          revisar: boolean;
          motivo: string | null;
          creada_en: string;
          corazones: number;
          mi_corazon: boolean;
        }[];
      };
      alternar_corazon: {
        Args: { p_foto: string; p_dispositivo: string };
        Returns: { mi_corazon: boolean; corazones: number }[];
      };
      fijar_momento: {
        Args: { p_momento: string };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
