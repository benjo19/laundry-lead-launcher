export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          ai_goals: string[] | null
          ai_system_prompt: string | null
          ai_tone: string | null
          business_description: string | null
          company_name: string | null
          company_values: string | null
          created_at: string
          email_signature: string | null
          id: string
          industry: string | null
          is_default: boolean | null
          location: string | null
          name: string
          target_audience: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          ai_goals?: string[] | null
          ai_system_prompt?: string | null
          ai_tone?: string | null
          business_description?: string | null
          company_name?: string | null
          company_values?: string | null
          created_at?: string
          email_signature?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          location?: string | null
          name: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          ai_goals?: string[] | null
          ai_system_prompt?: string | null
          ai_tone?: string | null
          business_description?: string | null
          company_name?: string | null
          company_values?: string | null
          created_at?: string
          email_signature?: string | null
          id?: string
          industry?: string | null
          is_default?: boolean | null
          location?: string | null
          name?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
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
      global_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          company: string
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          employees: string | null
          id: string
          industry: string | null
          location: string | null
          notes: string | null
          phone: string | null
          phone2: string | null
          pipeline_stage: string | null
          potential: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          city?: string | null
          company: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          employees?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          pipeline_stage?: string | null
          potential?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          city?: string | null
          company?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          employees?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          pipeline_stage?: string | null
          potential?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          token_email: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          token_email: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_email?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_items: {
        Row: {
          cijena_bez_pdv: number
          created_at: string | null
          id: string
          jedinica_mjere: string | null
          kolicina: number
          naziv: string
          offer_id: string
          opis: string | null
          popust: number | null
          redni_broj: number
        }
        Insert: {
          cijena_bez_pdv?: number
          created_at?: string | null
          id?: string
          jedinica_mjere?: string | null
          kolicina?: number
          naziv: string
          offer_id: string
          opis?: string | null
          popust?: number | null
          redni_broj?: number
        }
        Update: {
          cijena_bez_pdv?: number
          created_at?: string | null
          id?: string
          jedinica_mjere?: string | null
          kolicina?: number
          naziv?: string
          offer_id?: string
          opis?: string | null
          popust?: number | null
          redni_broj?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          broj_ponude: string
          created_at: string | null
          currency: string | null
          datum_ponude: string
          datum_valjanosti: string | null
          id: string
          klijent_adresa: string | null
          klijent_email: string | null
          klijent_ime: string
          klijent_oib: string | null
          lead_id: string | null
          napomena: string | null
          naslov: string
          pdv_stopa: number | null
          popust_ukupno: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broj_ponude: string
          created_at?: string | null
          currency?: string | null
          datum_ponude?: string
          datum_valjanosti?: string | null
          id?: string
          klijent_adresa?: string | null
          klijent_email?: string | null
          klijent_ime: string
          klijent_oib?: string | null
          lead_id?: string | null
          napomena?: string | null
          naslov: string
          pdv_stopa?: number | null
          popust_ukupno?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broj_ponude?: string
          created_at?: string | null
          currency?: string | null
          datum_ponude?: string
          datum_valjanosti?: string | null
          id?: string
          klijent_adresa?: string | null
          klijent_email?: string | null
          klijent_ime?: string
          klijent_oib?: string | null
          lead_id?: string | null
          napomena?: string | null
          naslov?: string
          pdv_stopa?: number | null
          popust_ukupno?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          calendar_event_id: string | null
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
          calendar_event_id?: string | null
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
          calendar_event_id?: string | null
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          google_calendar_settings: Json | null
          id: string
          make_settings: Json | null
          social_platforms: Json | null
          updated_at: string | null
          user_id: string
          zapier_settings: Json | null
        }
        Insert: {
          ai_settings?: Json | null
          business_profile?: Json | null
          created_at?: string | null
          email_provider?: string | null
          email_settings?: Json | null
          google_calendar_settings?: Json | null
          id?: string
          make_settings?: Json | null
          social_platforms?: Json | null
          updated_at?: string | null
          user_id: string
          zapier_settings?: Json | null
        }
        Update: {
          ai_settings?: Json | null
          business_profile?: Json | null
          created_at?: string | null
          email_provider?: string | null
          email_settings?: Json | null
          google_calendar_settings?: Json | null
          id?: string
          make_settings?: Json | null
          social_platforms?: Json | null
          updated_at?: string | null
          user_id?: string
          zapier_settings?: Json | null
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
      app_role: "super_admin" | "user"
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
    Enums: {
      app_role: ["super_admin", "user"],
    },
  },
} as const
