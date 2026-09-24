export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audio_clips: {
        Row: {
          created_at: string
          duration_ms: number | null
          entry_id: string | null
          id: string
          is_primary: boolean
          mime_type: string
          original_path: string | null
          published_at: string | null
          slow_storage_path: string | null
          speaker_id: string
          status: Database["public"]["Enums"]["content_status"]
          storage_path: string
          transcript: string | null
          updated_at: string
          word_timestamps: Json | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          entry_id?: string | null
          id?: string
          is_primary?: boolean
          mime_type?: string
          original_path?: string | null
          published_at?: string | null
          slow_storage_path?: string | null
          speaker_id: string
          status?: Database["public"]["Enums"]["content_status"]
          storage_path: string
          transcript?: string | null
          updated_at?: string
          word_timestamps?: Json | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          entry_id?: string | null
          id?: string
          is_primary?: boolean
          mime_type?: string
          original_path?: string | null
          published_at?: string | null
          slow_storage_path?: string | null
          speaker_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          storage_path?: string
          transcript?: string | null
          updated_at?: string
          word_timestamps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_clips_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_clips_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_notes: {
        Row: {
          body: Json
          category: Database["public"]["Enums"]["culture_category"]
          cover_image_path: string | null
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: Json | null
          title: Json
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          body?: Json
          category?: Database["public"]["Enums"]["culture_category"]
          cover_image_path?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: Json | null
          title: Json
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: Json
          category?: Database["public"]["Enums"]["culture_category"]
          cover_image_path?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: Json | null
          title?: Json
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_notes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_path: string | null
          notes: string | null
          part_of_speech: Database["public"]["Enums"]["part_of_speech"] | null
          published_at: string | null
          region_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          text_arabic: string | null
          text_latin: string
          text_tifinagh: string | null
          translations: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          notes?: string | null
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          published_at?: string | null
          region_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          text_arabic?: string | null
          text_latin: string
          text_tifinagh?: string | null
          translations: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          notes?: string | null
          part_of_speech?: Database["public"]["Enums"]["part_of_speech"] | null
          published_at?: string | null
          region_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          text_arabic?: string | null
          text_latin?: string
          text_tifinagh?: string | null
          translations?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_stats: {
        Row: {
          created_at: string
          current_streak: number
          last_active_on: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_active_on?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_active_on?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "learner_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          steps: Json
          title: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          title: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      level_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          level_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          level_id: string
          stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          level_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          id: string
          lesson_id: string | null
          map_x: number
          map_y: number
          position: number
          published_at: string | null
          quiz_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: Json | null
          type: Database["public"]["Enums"]["level_type"]
          unit_id: string
          unlock_rule: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          map_x?: number
          map_y?: number
          position: number
          published_at?: string | null
          quiz_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: Json | null
          type: Database["public"]["Enums"]["level_type"]
          unit_id: string
          unlock_rule?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          map_x?: number
          map_y?: number
          position?: number
          published_at?: string | null
          quiz_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: Json | null
          type?: Database["public"]["Enums"]["level_type"]
          unit_id?: string
          unlock_rule?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "levels_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          published_at: string | null
          questions: Json
          status: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_at?: string | null
          questions?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string | null
          questions?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      speakers: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          created_at: string
          display_name: string
          id: string
          public_bio: Json | null
          region_id: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          display_name: string
          id?: string
          public_bio?: Json | null
          region_id?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          display_name?: string
          id?: string
          public_bio?: Json | null
          region_id?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_items: {
        Row: {
          created_at: string
          due_at: string
          ease: number
          entry_id: string
          interval_days: number
          lapses: number
          last_reviewed_at: string | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string
          ease?: number
          entry_id: string
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          ease?: number
          entry_id?: string
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "srs_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          audio_consent: boolean
          audio_path: string | null
          contributor_email: string | null
          contributor_name: string | null
          created_at: string
          created_entry_id: string | null
          id: string
          kind: Database["public"]["Enums"]["submission_kind"]
          message: string | null
          region_id: string | null
          related_entry_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitter_id: string | null
          text_arabic: string | null
          text_latin: string | null
          text_tifinagh: string | null
          translations: Json | null
          updated_at: string
          village: string | null
        }
        Insert: {
          audio_consent?: boolean
          audio_path?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string
          created_entry_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["submission_kind"]
          message?: string | null
          region_id?: string | null
          related_entry_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitter_id?: string | null
          text_arabic?: string | null
          text_latin?: string | null
          text_tifinagh?: string | null
          translations?: Json | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          audio_consent?: boolean
          audio_path?: string | null
          contributor_email?: string | null
          contributor_name?: string | null
          created_at?: string
          created_entry_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["submission_kind"]
          message?: string | null
          region_id?: string | null
          related_entry_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitter_id?: string | null
          text_arabic?: string | null
          text_latin?: string | null
          text_tifinagh?: string | null
          translations?: Json | null
          updated_at?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_created_entry_id_fkey"
            columns: ["created_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_related_entry_id_fkey"
            columns: ["related_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          cover_image_path: string | null
          created_at: string
          description: Json | null
          id: string
          map_theme: Database["public"]["Enums"]["map_theme"]
          position: number
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at: string
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          description?: Json | null
          id?: string
          map_theme?: Database["public"]["Enums"]["map_theme"]
          position: number
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at?: string
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          description?: Json | null
          id?: string
          map_theme?: Database["public"]["Enums"]["map_theme"]
          position?: number
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_level: {
        Args: {
          p_entry_ids: string[]
          p_level_id: string
          p_stars: number
          p_today: string
          p_xp: number
        }
        Returns: {
          created_at: string
          current_streak: number
          last_active_on: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "learner_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_localized_text: { Args: { value: Json }; Returns: boolean }
      log_activity: {
        Args: { p_today: string; p_xp: number }
        Returns: {
          created_at: string
          current_streak: number
          last_active_on: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "learner_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      merge_guest_progress: {
        Args: { p_snapshot: Json; p_today: string }
        Returns: {
          created_at: string
          current_streak: number
          last_active_on: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "learner_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      next_streak: {
        Args: {
          p_current: number
          p_last: string
          p_longest: number
          p_today: string
        }
        Returns: Record<string, unknown>
      }
      referenced_entry_ids: { Args: { payload: Json }; Returns: string[] }
      require_learner: { Args: { p_today: string }; Returns: string }
    }
    Enums: {
      app_role: "learner" | "admin"
      content_status: "draft" | "published"
      culture_category:
        | "music"
        | "jewelry"
        | "history"
        | "yennayer"
        | "food"
        | "crafts"
        | "daily_life"
        | "other"
      level_type: "lesson" | "quiz" | "review" | "boss" | "story"
      map_theme:
        | "aures_peaks"
        | "cedar_forest"
        | "cliff_villages"
        | "palm_groves"
      part_of_speech:
        | "noun"
        | "verb"
        | "adjective"
        | "adverb"
        | "pronoun"
        | "preposition"
        | "conjunction"
        | "interjection"
        | "numeral"
        | "particle"
        | "phrase"
        | "expression"
      submission_kind: "word" | "variation" | "correction" | "recording"
      submission_status: "pending" | "approved" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["learner", "admin"],
      content_status: ["draft", "published"],
      culture_category: [
        "music",
        "jewelry",
        "history",
        "yennayer",
        "food",
        "crafts",
        "daily_life",
        "other",
      ],
      level_type: ["lesson", "quiz", "review", "boss", "story"],
      map_theme: [
        "aures_peaks",
        "cedar_forest",
        "cliff_villages",
        "palm_groves",
      ],
      part_of_speech: [
        "noun",
        "verb",
        "adjective",
        "adverb",
        "pronoun",
        "preposition",
        "conjunction",
        "interjection",
        "numeral",
        "particle",
        "phrase",
        "expression",
      ],
      submission_kind: ["word", "variation", "correction", "recording"],
      submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const

