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
      jarvis_actions: {
        Row: {
          action_level: string
          action_type: string
          agent: string
          approval_required: boolean
          approval_status: string
          completed_at: string | null
          confidence: number | null
          correlation_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          execution_result: Json
          execution_status: string
          id: string
          intent: string | null
          project: string | null
          requested_at: string
          requested_payload: Json
          source_channel: string
          sources_used: Json
          started_at: string | null
          target_entity_id: string | null
          target_entity_type: string | null
          target_system: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_level?: string
          action_type: string
          agent: string
          approval_required?: boolean
          approval_status?: string
          completed_at?: string | null
          confidence?: number | null
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          execution_result?: Json
          execution_status?: string
          id?: string
          intent?: string | null
          project?: string | null
          requested_at?: string
          requested_payload?: Json
          source_channel?: string
          sources_used?: Json
          started_at?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_system?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_level?: string
          action_type?: string
          agent?: string
          approval_required?: boolean
          approval_status?: string
          completed_at?: string | null
          confidence?: number | null
          correlation_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          execution_result?: Json
          execution_status?: string
          id?: string
          intent?: string | null
          project?: string | null
          requested_at?: string
          requested_payload?: Json
          source_channel?: string
          sources_used?: Json
          started_at?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_system?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      jarvis_agent_runs: {
        Row: {
          agent: string
          completed_at: string | null
          id: string
          input_context: Json
          result: Json | null
          started_at: string
          status: string
          user_id: string
          user_request: string
        }
        Insert: {
          agent: string
          completed_at?: string | null
          id?: string
          input_context?: Json
          result?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          user_request: string
        }
        Update: {
          agent?: string
          completed_at?: string | null
          id?: string
          input_context?: Json
          result?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          user_request?: string
        }
        Relationships: []
      }
      jarvis_alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          project: string | null
          resolved_at: string | null
          severity: string
          source: string | null
          source_id: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          project?: string | null
          resolved_at?: string | null
          severity?: string
          source?: string | null
          source_id?: string | null
          status?: string
          title: string
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          project?: string | null
          resolved_at?: string | null
          severity?: string
          source?: string | null
          source_id?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      jarvis_approvals: {
        Row: {
          capability: string
          decided_at: string | null
          decided_by: string | null
          decision_id: string | null
          decision_note: string | null
          execution_claim_id: string | null
          execution_claimed_at: string | null
          expires_at: string
          id: string
          request_payload: Json
          requested_at: string
          source_channel: string | null
          source_chat_id: string | null
          source_message_id: string | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          capability: string
          decided_at?: string | null
          decided_by?: string | null
          decision_id?: string | null
          decision_note?: string | null
          execution_claim_id?: string | null
          execution_claimed_at?: string | null
          expires_at?: string
          id?: string
          request_payload?: Json
          requested_at?: string
          source_channel?: string | null
          source_chat_id?: string | null
          source_message_id?: string | null
          status?: string
          task_id: string
          user_id?: string
        }
        Update: {
          capability?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_id?: string | null
          decision_note?: string | null
          execution_claim_id?: string | null
          execution_claimed_at?: string | null
          expires_at?: string
          id?: string
          request_payload?: Json
          requested_at?: string
          source_channel?: string | null
          source_chat_id?: string | null
          source_message_id?: string | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_approvals_capability_fkey"
            columns: ["capability"]
            isOneToOne: false
            referencedRelation: "jarvis_permission_rules"
            referencedColumns: ["capability"]
          },
          {
            foreignKeyName: "jarvis_approvals_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "jarvis_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "jarvis_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_audit_log: {
        Row: {
          action: string
          actor_type: string
          approval_id: string | null
          created_at: string
          details: Json
          event_id: string | null
          id: number
          task_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_type: string
          approval_id?: string | null
          created_at?: string
          details?: Json
          event_id?: string | null
          id?: never
          task_id?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          actor_type?: string
          approval_id?: string | null
          created_at?: string
          details?: Json
          event_id?: string | null
          id?: never
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_audit_log_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "jarvis_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "jarvis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "jarvis_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jarvis_decisions: {
        Row: {
          capability: string
          classification: string
          confidence: number | null
          created_at: string
          details: Json
          event_id: string
          id: string
          permission_mode: string
          reason: string
          run_id: string | null
          user_id: string
        }
        Insert: {
          capability: string
          classification: string
          confidence?: number | null
          created_at?: string
          details?: Json
          event_id: string
          id?: string
          permission_mode: string
          reason: string
          run_id?: string | null
          user_id?: string
        }
        Update: {
          capability?: string
          classification?: string
          confidence?: number | null
          created_at?: string
          details?: Json
          event_id?: string
          id?: string
          permission_mode?: string
          reason?: string
          run_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_decisions_capability_fkey"
            columns: ["capability"]
            isOneToOne: false
            referencedRelation: "jarvis_permission_rules"
            referencedColumns: ["capability"]
          },
          {
            foreignKeyName: "jarvis_decisions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "jarvis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_decisions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "jarvis_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_events: {
        Row: {
          classified_at: string | null
          event_type: string
          external_id: string | null
          id: string
          payload: Json
          received_at: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          classified_at?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          payload?: Json
          received_at?: string
          source: string
          status?: string
          user_id?: string
        }
        Update: {
          classified_at?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          payload?: Json
          received_at?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      jarvis_inbox: {
        Row: {
          classification: string | null
          created_at: string
          extracted_data: Json
          file_name: string
          file_type: string | null
          id: string
          status: string
          storage_path: string | null
          suggested_action: Json
          user_id: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          extracted_data?: Json
          file_name: string
          file_type?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          suggested_action?: Json
          user_id?: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          extracted_data?: Json
          file_name?: string
          file_type?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          suggested_action?: Json
          user_id?: string
        }
        Relationships: []
      }
      jarvis_messages: {
        Row: {
          agent: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          agent?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          user_id?: string
        }
        Update: {
          agent?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "jarvis_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_outcomes: {
        Row: {
          action_id: string | null
          confidence: number | null
          correlation_id: string
          entity_id: string | null
          entity_type: string | null
          evidence: Json
          facts: Json
          id: string
          learned_rule: string | null
          metadata: Json
          next_action: string | null
          next_action_at: string | null
          occurred_at: string
          outcome_status: string
          outcome_type: string
          project: string | null
          recorded_at: string
          reusable: boolean
          source_record_id: string | null
          source_system: string | null
          summary: string
          supersedes_outcome_id: string | null
          user_id: string | null
        }
        Insert: {
          action_id?: string | null
          confidence?: number | null
          correlation_id?: string
          entity_id?: string | null
          entity_type?: string | null
          evidence?: Json
          facts?: Json
          id?: string
          learned_rule?: string | null
          metadata?: Json
          next_action?: string | null
          next_action_at?: string | null
          occurred_at?: string
          outcome_status?: string
          outcome_type: string
          project?: string | null
          recorded_at?: string
          reusable?: boolean
          source_record_id?: string | null
          source_system?: string | null
          summary: string
          supersedes_outcome_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_id?: string | null
          confidence?: number | null
          correlation_id?: string
          entity_id?: string | null
          entity_type?: string | null
          evidence?: Json
          facts?: Json
          id?: string
          learned_rule?: string | null
          metadata?: Json
          next_action?: string | null
          next_action_at?: string | null
          occurred_at?: string
          outcome_status?: string
          outcome_type?: string
          project?: string | null
          recorded_at?: string
          reusable?: boolean
          source_record_id?: string | null
          source_system?: string | null
          summary?: string
          supersedes_outcome_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_outcomes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "jarvis_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_outcomes_supersedes_outcome_id_fkey"
            columns: ["supersedes_outcome_id"]
            isOneToOne: false
            referencedRelation: "jarvis_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_permission_rules: {
        Row: {
          capability: string
          description: string
          mode: string
          updated_at: string
        }
        Insert: {
          capability: string
          description: string
          mode: string
          updated_at?: string
        }
        Update: {
          capability?: string
          description?: string
          mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      jarvis_tasks: {
        Row: {
          capability: string | null
          classification: string | null
          created_at: string
          decision_id: string | null
          description: string | null
          due_at: string | null
          event_id: string | null
          id: string
          priority: string
          project: string | null
          requires_approval: boolean
          source: string | null
          source_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capability?: string | null
          classification?: string | null
          created_at?: string
          decision_id?: string | null
          description?: string | null
          due_at?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          project?: string | null
          requires_approval?: boolean
          source?: string | null
          source_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          capability?: string | null
          classification?: string | null
          created_at?: string
          decision_id?: string | null
          description?: string | null
          due_at?: string | null
          event_id?: string | null
          id?: string
          priority?: string
          project?: string | null
          requires_approval?: boolean
          source?: string | null
          source_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_tasks_capability_fkey"
            columns: ["capability"]
            isOneToOne: false
            referencedRelation: "jarvis_permission_rules"
            referencedColumns: ["capability"]
          },
          {
            foreignKeyName: "jarvis_tasks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "jarvis_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jarvis_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "jarvis_events"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_telegram_identities: {
        Row: {
          created_at: string
          id: string
          revoked_at: string | null
          telegram_chat_id: number
          telegram_user_id: number
          user_id: string
          verification_method: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          revoked_at?: string | null
          telegram_chat_id: number
          telegram_user_id: number
          user_id: string
          verification_method: string
          verified_at: string
        }
        Update: {
          created_at?: string
          id?: string
          revoked_at?: string | null
          telegram_chat_id?: number
          telegram_user_id?: number
          user_id?: string
          verification_method?: string
          verified_at?: string
        }
        Relationships: []
      }
      jarvis_telegram_link_challenges: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          occurred_at: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          occurred_at?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          occurred_at?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_controller_today"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          lead_id: string
          new_data: Json | null
          old_data: Json | null
          source: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          new_data?: Json | null
          old_data?: Json | null
          source?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          new_data?: Json | null
          old_data?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_audit_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_audit_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_controller_today"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intelligence: {
        Row: {
          assumptions: Json
          automation_opportunities: Json
          business_summary: string | null
          confirmed_pain: string | null
          created_at: string
          decision_makers: Json
          last_call_learning: string | null
          lead_id: string
          lead_score: number | null
          likely_pain_points: Json
          observed_facts: Json
          opening_question: string | null
          previous_topics: string | null
          products_services: string | null
          recommended_call_angle: string | null
          recommended_solution: string | null
          research_status: string
          research_version: string
          researched_at: string | null
          review_insights: string | null
          score_reason: string | null
          social_analysis: string | null
          sources: Json
          updated_at: string
          user_id: string
          website_analysis: string | null
        }
        Insert: {
          assumptions?: Json
          automation_opportunities?: Json
          business_summary?: string | null
          confirmed_pain?: string | null
          created_at?: string
          decision_makers?: Json
          last_call_learning?: string | null
          lead_id: string
          lead_score?: number | null
          likely_pain_points?: Json
          observed_facts?: Json
          opening_question?: string | null
          previous_topics?: string | null
          products_services?: string | null
          recommended_call_angle?: string | null
          recommended_solution?: string | null
          research_status?: string
          research_version?: string
          researched_at?: string | null
          review_insights?: string | null
          score_reason?: string | null
          social_analysis?: string | null
          sources?: Json
          updated_at?: string
          user_id: string
          website_analysis?: string | null
        }
        Update: {
          assumptions?: Json
          automation_opportunities?: Json
          business_summary?: string | null
          confirmed_pain?: string | null
          created_at?: string
          decision_makers?: Json
          last_call_learning?: string | null
          lead_id?: string
          lead_score?: number | null
          likely_pain_points?: Json
          observed_facts?: Json
          opening_question?: string | null
          previous_topics?: string | null
          products_services?: string | null
          recommended_call_angle?: string | null
          recommended_solution?: string | null
          research_status?: string
          research_version?: string
          researched_at?: string | null
          review_insights?: string | null
          score_reason?: string | null
          social_analysis?: string | null
          sources?: Json
          updated_at?: string
          user_id?: string
          website_analysis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_intelligence_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_intelligence_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "sales_controller_today"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          actual_mrr: number | null
          ai_call_duration_secs: number | null
          ai_call_sid: string | null
          ai_call_status: string | null
          ai_call_summary: string | null
          ai_cold_call_enabled: boolean
          ai_conversation_id: string | null
          ai_last_call_at: string | null
          assigned_to: string | null
          city: string | null
          company: string
          contact_outcome: string | null
          contact_person: string | null
          contact_type: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          do_not_call: boolean
          email: string | null
          employees: string | null
          followup_count: number
          followup_locked_at: string | null
          id: string
          industry: string | null
          interested_in: string | null
          last_contact_at: string | null
          last_followup_at: string | null
          lead_score: number | null
          location: string | null
          locations_count: number | null
          lost_reason: string | null
          next_action_at: string | null
          next_step: string | null
          notes: string | null
          opportunity_value: number | null
          phone: string | null
          phone2: string | null
          pipeline_stage: string | null
          potential: string | null
          research_automation_opportunities: Json
          research_business_summary: string | null
          research_call_angle: string | null
          research_likely_pain_points: Json
          research_observed_facts: Json
          research_opening_question: string | null
          research_recommended_solution: string | null
          research_score_reason: string | null
          research_sources: Json
          research_status: string
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          website: string | null
          won_locations_count: number | null
        }
        Insert: {
          actual_mrr?: number | null
          ai_call_duration_secs?: number | null
          ai_call_sid?: string | null
          ai_call_status?: string | null
          ai_call_summary?: string | null
          ai_cold_call_enabled?: boolean
          ai_conversation_id?: string | null
          ai_last_call_at?: string | null
          assigned_to?: string | null
          city?: string | null
          company: string
          contact_outcome?: string | null
          contact_person?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          do_not_call?: boolean
          email?: string | null
          employees?: string | null
          followup_count?: number
          followup_locked_at?: string | null
          id?: string
          industry?: string | null
          interested_in?: string | null
          last_contact_at?: string | null
          last_followup_at?: string | null
          lead_score?: number | null
          location?: string | null
          locations_count?: number | null
          lost_reason?: string | null
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          opportunity_value?: number | null
          phone?: string | null
          phone2?: string | null
          pipeline_stage?: string | null
          potential?: string | null
          research_automation_opportunities?: Json
          research_business_summary?: string | null
          research_call_angle?: string | null
          research_likely_pain_points?: Json
          research_observed_facts?: Json
          research_opening_question?: string | null
          research_recommended_solution?: string | null
          research_score_reason?: string | null
          research_sources?: Json
          research_status?: string
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          won_locations_count?: number | null
        }
        Update: {
          actual_mrr?: number | null
          ai_call_duration_secs?: number | null
          ai_call_sid?: string | null
          ai_call_status?: string | null
          ai_call_summary?: string | null
          ai_cold_call_enabled?: boolean
          ai_conversation_id?: string | null
          ai_last_call_at?: string | null
          assigned_to?: string | null
          city?: string | null
          company?: string
          contact_outcome?: string | null
          contact_person?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          do_not_call?: boolean
          email?: string | null
          employees?: string | null
          followup_count?: number
          followup_locked_at?: string | null
          id?: string
          industry?: string | null
          interested_in?: string | null
          last_contact_at?: string | null
          last_followup_at?: string | null
          lead_score?: number | null
          location?: string | null
          locations_count?: number | null
          lost_reason?: string | null
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          opportunity_value?: number | null
          phone?: string | null
          phone2?: string | null
          pipeline_stage?: string | null
          potential?: string | null
          research_automation_opportunities?: Json
          research_business_summary?: string | null
          research_call_angle?: string | null
          research_likely_pain_points?: Json
          research_observed_facts?: Json
          research_opening_question?: string | null
          research_recommended_solution?: string | null
          research_score_reason?: string | null
          research_sources?: Json
          research_status?: string
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          won_locations_count?: number | null
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
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_controller_today"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          location_id: string
          note: string | null
          paid_at: string | null
          partner_user_id: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          location_id: string
          note?: string | null
          paid_at?: string | null
          partner_user_id: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          location_id?: string
          note?: string | null
          paid_at?: string | null
          partner_user_id?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "partner_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_locations: {
        Row: {
          activated_at: string
          city: string | null
          created_at: string
          customer_name: string
          deactivated_at: string | null
          id: string
          lead_id: string | null
          location_name: string
          monthly_commission: number
          partner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          city?: string | null
          created_at?: string
          customer_name: string
          deactivated_at?: string | null
          id?: string
          lead_id?: string | null
          location_name: string
          monthly_commission?: number
          partner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          city?: string | null
          created_at?: string
          customer_name?: string
          deactivated_at?: string | null
          id?: string
          lead_id?: string | null
          location_name?: string
          monthly_commission?: number
          partner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_locations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_locations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_controller_today"
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
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
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
      sales_events: {
        Row: {
          channel: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string | null
          metadata: Json
          occurred_at: string
          project: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          project?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          occurred_at?: string
          project?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_controller_today"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_partner_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          status?: string
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
      sales_controller_digest: {
        Row: {
          ceka_datum: number | null
          ceka_items: string | null
          danas_nazvati: number | null
          danas_odgovoriti: number | null
          followup_danas: number | null
          followup_items: string | null
          hot_items: string | null
          hot_leadovi: number | null
          nazvati_items: string | null
          odgovoriti_items: string | null
          pipeline_eur: number | null
          ponude_bez_odgovora: number | null
          ponude_items: string | null
          pregled_items: string | null
          rucni_pregled: number | null
        }
        Relationships: []
      }
      sales_controller_summary: {
        Row: {
          ceka_datum: number | null
          danas_nazvati: number | null
          danas_odgovoriti: number | null
          followup_danas: number | null
          hot_leadovi: number | null
          pipeline_eur: number | null
          ponude_bez_odgovora: number | null
          rucni_pregled: number | null
        }
        Relationships: []
      }
      sales_controller_today: {
        Row: {
          action_category: string | null
          company: string | null
          contact_outcome: string | null
          contact_type: string | null
          effective_action_date: string | null
          email: string | null
          followup_count: number | null
          id: string | null
          interested_in: string | null
          is_hot: boolean | null
          last_contact_at: string | null
          next_action_at: string | null
          next_step: string | null
          notes: string | null
          opportunity_value: number | null
          phone: string | null
          pipeline_stage: string | null
          priority_score: number | null
          status: string | null
        }
        Relationships: []
      }
      sales_funnel_30d: {
        Row: {
          calls: number | null
          emails_sent: number | null
          followups_sent: number | null
          interested: number | null
          interested_rate_pct: number | null
          leads_created: number | null
          lost: number | null
          offers_accepted: number | null
          offers_sent: number | null
          project: string | null
          replies: number | null
          reply_rate_pct: number | null
          won: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_sales_followup: { Args: { p_lead_id: string }; Returns: boolean }
      complete_sales_followup: { Args: { p_lead_id: string }; Returns: Json }
      debug_automind_payload: { Args: { "": Json }; Returns: Json }
      delete_lead_complete: { Args: { p_lead_id: string }; Returns: undefined }
      is_current_super_admin: { Args: never; Returns: boolean }
      jarvis_approve_once: { Args: { p_approval_id: string }; Returns: Json }
      jarvis_begin_telegram_link: { Args: never; Returns: Json }
      jarvis_claim_approved_once: {
        Args: { p_approval_id: string }
        Returns: Json
      }
      jarvis_complete_telegram_link: {
        Args: {
          p_telegram_chat_id: number
          p_telegram_user_id: number
          p_token: string
        }
        Returns: Json
      }
      jarvis_process_event: { Args: { p_event_id: string }; Returns: Json }
      log_sales_event: {
        Args: {
          p_channel?: string
          p_event_type: string
          p_lead_id: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_automind_reply:
        | {
            Args: { "": Json }
            Returns: {
              company: string
              id: string
              next_action_at: string
              pipeline_stage: string
              status: string
            }[]
          }
        | {
            Args: { p_classification: string; p_lead_id: string }
            Returns: {
              company: string
              id: string
              next_action_at: string
              pipeline_stage: string
              status: string
            }[]
          }
      mark_laundry_reply:
        | {
            Args: { "": Json }
            Returns: {
              company: string
              id: string
              next_action_at: string
              pipeline_stage: string
              status: string
            }[]
          }
        | {
            Args: { p_classification: string; p_lead_id: string }
            Returns: {
              company: string
              id: string
              next_action_at: string
              pipeline_stage: string
              status: string
            }[]
          }
      mark_sales_followup_sent: {
        Args: { p_lead_id: string }
        Returns: {
          company: string
          followup_count: number
          id: string
          next_action_at: string
          next_step: string
        }[]
      }
      process_automind_ai_interest:
        | { Args: { "": Json }; Returns: Json }
        | { Args: { p_info: string }; Returns: Json }
      release_sales_followup_lock: {
        Args: { p_lead_id: string }
        Returns: boolean
      }
      sales_project_for_lead: {
        Args: { p_interested_in: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "user" | "sales_partner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "user", "sales_partner"],
    },
  },
} as const
