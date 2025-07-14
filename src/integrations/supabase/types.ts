export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      emails: {
        Row: {
          click_rate: string | null
          content: string
          created_at: string | null
          id: string
          open_rate: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template: string | null
          to_email: string
          user_id: string
        }
        Insert: {
          click_rate?: string | null
          content: string
          created_at?: string | null
          id?: string
          open_rate?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template?: string | null
          to_email: string
          user_id: string
        }
        Update: {
          click_rate?: string | null
          content?: string
          created_at?: string | null
          id?: string
          open_rate?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template?: string | null
          to_email?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string
          created_at: string | null
          email: string | null
          employees: string | null
          id: string
          industry: string | null
          location: string | null
          notes: string | null
          phone: string | null
          potential: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          email?: string | null
          employees?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          potential?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string | null
          employees?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          potential?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          company: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          lead_id: string | null
          priority: string
          status: string
          time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_knowledge: {
        Row: {
          content: string | null
          created_at: string
          file_path: string | null
          id: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_settings: Json | null
          business_profile: Json | null
          created_at: string | null
          email_provider: string | null
          email_settings: Json | null
          id: string
          make_settings: Json | null
          social_platforms: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_settings?: Json | null
          business_profile?: Json | null
          created_at?: string | null
          email_provider?: string | null
          email_settings?: Json | null
          id?: string
          make_settings?: Json | null
          social_platforms?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_settings?: Json | null
          business_profile?: Json | null
          created_at?: string | null
          email_provider?: string | null
          email_settings?: Json | null
          id?: string
          make_settings?: Json | null
          social_platforms?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
