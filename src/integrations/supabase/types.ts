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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string
          hash: string
          id: string
          issued_at: string
          owner_id: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          doc_number: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string
          hash: string
          id?: string
          issued_at: string
          owner_id: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          doc_number?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_url?: string
          hash?: string
          id?: string
          issued_at?: string
          owner_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "trade_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          action: Database["public"]["Enums"]["ledger_action"]
          actor_id: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: Database["public"]["Enums"]["ledger_action"]
          actor_id: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: Database["public"]["Enums"]["ledger_action"]
          actor_id?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          org_name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          org_name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_name?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          category: Database["public"]["Enums"]["risk_category"]
          id: string
          last_updated: string
          rationale: string
          score: number
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["risk_category"]
          id?: string
          last_updated?: string
          rationale?: string
          score?: number
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["risk_category"]
          id?: string
          last_updated?: string
          rationale?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      trade_transactions: {
        Row: {
          amount: number | null
          buyer_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          buyer_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          seller_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          buyer_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "bank" | "corporate" | "auditor" | "admin" | "system"
      doc_type:
        | "LOC"
        | "INVOICE"
        | "BILL_OF_LADING"
        | "PO"
        | "COO"
        | "INSURANCE_CERT"
      ledger_action:
        | "ISSUED"
        | "AMENDED"
        | "SHIPPED"
        | "RECEIVED"
        | "PAID"
        | "CANCELLED"
        | "VERIFIED"
        | "RISK_RECALCULATED"
      risk_category: "LOW" | "MEDIUM" | "HIGH"
      transaction_status:
        | "OPEN"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "DISPUTED"
        | "CANCELLED"
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
      app_role: ["bank", "corporate", "auditor", "admin", "system"],
      doc_type: [
        "LOC",
        "INVOICE",
        "BILL_OF_LADING",
        "PO",
        "COO",
        "INSURANCE_CERT",
      ],
      ledger_action: [
        "ISSUED",
        "AMENDED",
        "SHIPPED",
        "RECEIVED",
        "PAID",
        "CANCELLED",
        "VERIFIED",
        "RISK_RECALCULATED",
      ],
      risk_category: ["LOW", "MEDIUM", "HIGH"],
      transaction_status: [
        "OPEN",
        "IN_PROGRESS",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ],
    },
  },
} as const
