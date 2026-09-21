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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
