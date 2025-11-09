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
      analysis_history: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          data_source_id: string | null
          id: string
          insights: Json | null
          overall_score: number | null
          skills_identified: number | null
          summary: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          data_source_id?: string | null
          id?: string
          insights?: Json | null
          overall_score?: number | null
          skills_identified?: number | null
          summary?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          data_source_id?: string | null
          id?: string
          insights?: Json | null
          overall_score?: number | null
          skills_identified?: number | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_goals: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          progress: number | null
          status: string | null
          target_date: string | null
          target_skills: string[] | null
          timeline: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          target_date?: string | null
          target_skills?: string[] | null
          timeline?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          progress?: number | null
          status?: string | null
          target_date?: string | null
          target_skills?: string[] | null
          timeline?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          created_at: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          raw_content: string | null
          source_name: string
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          raw_content?: string | null
          source_name: string
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          raw_content?: string | null
          source_name?: string
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_date: string | null
          created_at: string | null
          id: string
          job_id: string
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_date?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_date?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          analysis: Json | null
          created_at: string | null
          id: string
          job_id: string
          match_score: number | null
          matching_skills: string[] | null
          missing_skills: string[] | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          matching_skills?: string[] | null
          missing_skills?: string[] | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          matching_skills?: string[] | null
          missing_skills?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          posted_by: string | null
          preferred_skills: string[] | null
          required_skills: string[] | null
          salary_range: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_by?: string | null
          preferred_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_by?: string | null
          preferred_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          estimated_duration: string | null
          goal_id: string | null
          id: string
          is_active: boolean
          path_data: Json
          path_title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          estimated_duration?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean
          path_data: Json
          path_title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          estimated_duration?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean
          path_data?: Json
          path_title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "career_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          provider: string | null
          resource_type: string
          skill_id: string | null
          title: string
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          provider?: string | null
          resource_type: string
          skill_id?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          provider?: string | null
          resource_type?: string
          skill_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_framework"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"] | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"] | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_role_audit: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_role: Database["public"]["Enums"]["org_role"]
          old_role: Database["public"]["Enums"]["org_role"] | null
          organization_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_role: Database["public"]["Enums"]["org_role"]
          old_role?: Database["public"]["Enums"]["org_role"] | null
          organization_id: string
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_role?: Database["public"]["Enums"]["org_role"]
          old_role?: Database["public"]["Enums"]["org_role"] | null
          organization_id?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          privacy_default: Database["public"]["Enums"]["privacy_level"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          organization_id?: string | null
          privacy_default?: Database["public"]["Enums"]["privacy_level"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          privacy_default?: Database["public"]["Enums"]["privacy_level"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      skill_endorsements: {
        Row: {
          created_at: string
          endorsed_by: string
          endorsement_text: string | null
          id: string
          user_skill_id: string
        }
        Insert: {
          created_at?: string
          endorsed_by: string
          endorsement_text?: string | null
          id?: string
          user_skill_id: string
        }
        Update: {
          created_at?: string
          endorsed_by?: string
          endorsement_text?: string | null
          id?: string
          user_skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_endorsements_user_skill_id_fkey"
            columns: ["user_skill_id"]
            isOneToOne: false
            referencedRelation: "user_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_framework: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          name: string
          parent_skill_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          name: string
          parent_skill_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          parent_skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_framework_parent_skill_id_fkey"
            columns: ["parent_skill_id"]
            isOneToOne: false
            referencedRelation: "skill_framework"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gaps: {
        Row: {
          created_at: string | null
          current_count: number | null
          gap_severity: string | null
          id: string
          organization_id: string
          recommendations: string | null
          required_count: number | null
          skill_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          gap_severity?: string | null
          id?: string
          organization_id: string
          recommendations?: string | null
          required_count?: number | null
          skill_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          gap_severity?: string | null
          id?: string
          organization_id?: string
          recommendations?: string | null
          required_count?: number | null
          skill_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_gaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_gaps_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_framework"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_history: {
        Row: {
          confidence_score: number | null
          data_source_id: string | null
          id: string
          notes: string | null
          proficiency_level: string
          recorded_at: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          data_source_id?: string | null
          id?: string
          notes?: string | null
          proficiency_level: string
          recorded_at?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          data_source_id?: string | null
          id?: string
          notes?: string | null
          proficiency_level?: string
          recorded_at?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_history_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_history_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_framework"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          endorsement_count: number | null
          evidence: string[] | null
          id: string
          is_explicit: boolean | null
          is_verified: boolean | null
          privacy_level: Database["public"]["Enums"]["privacy_level"] | null
          proficiency_level:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          endorsement_count?: number | null
          evidence?: string[] | null
          id?: string
          is_explicit?: boolean | null
          is_verified?: boolean | null
          privacy_level?: Database["public"]["Enums"]["privacy_level"] | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          endorsement_count?: number | null
          evidence?: string[] | null
          id?: string
          is_explicit?: boolean | null
          is_verified?: boolean | null
          privacy_level?: Database["public"]["Enums"]["privacy_level"] | null
          proficiency_level?:
            | Database["public"]["Enums"]["proficiency_level"]
            | null
          skill_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_framework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_org_role: {
        Args: {
          _org_id: string
          _required_role: Database["public"]["Enums"]["org_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "interested" | "applied" | "rejected"
      data_source_type:
        | "cv"
        | "linkedin"
        | "github"
        | "blog"
        | "performance_review"
        | "reference_letter"
        | "goal_document"
        | "other"
      org_role: "member" | "manager" | "admin" | "owner"
      privacy_level: "private" | "organization" | "public"
      proficiency_level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
      skill_category:
        | "Technical"
        | "Soft"
        | "Domain"
        | "Language"
        | "Business"
        | "Leadership"
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
      application_status: ["interested", "applied", "rejected"],
      data_source_type: [
        "cv",
        "linkedin",
        "github",
        "blog",
        "performance_review",
        "reference_letter",
        "goal_document",
        "other",
      ],
      org_role: ["member", "manager", "admin", "owner"],
      privacy_level: ["private", "organization", "public"],
      proficiency_level: ["Beginner", "Intermediate", "Advanced", "Expert"],
      skill_category: [
        "Technical",
        "Soft",
        "Domain",
        "Language",
        "Business",
        "Leadership",
      ],
    },
  },
} as const
