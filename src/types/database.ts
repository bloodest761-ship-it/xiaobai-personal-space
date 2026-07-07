export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "app_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      entries: {
        Row: {
          id: string;
          title: string;
          slug: string;
          type: "reflection" | "essay" | "project" | "understanding";
          status: "draft" | "published" | "archived";
          summary: string | null;
          content_json: Json;
          content_text: string | null;
          cover_path: string | null;
          tags: string[];
          featured: boolean;
          featured_order: number | null;
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          type: "reflection" | "essay" | "project" | "understanding";
          status?: "draft" | "published" | "archived";
          summary?: string | null;
          content_json: Json;
          content_text?: string | null;
          cover_path?: string | null;
          tags?: string[];
          featured?: boolean;
          featured_order?: number | null;
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          type?: "reflection" | "essay" | "project" | "understanding";
          status?: "draft" | "published" | "archived";
          summary?: string | null;
          content_json?: Json;
          content_text?: string | null;
          cover_path?: string | null;
          tags?: string[];
          featured?: boolean;
          featured_order?: number | null;
          metadata?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_app_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
