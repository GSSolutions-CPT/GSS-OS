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
            announcements: {
                Row: {
                    author_id: string
                    created_at: string
                    id: string
                    message: string
                }
                Insert: {
                    author_id: string
                    created_at?: string
                    id?: string
                    message: string
                }
                Update: {
                    author_id?: string
                    created_at?: string
                    id?: string
                    message?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "announcements_author_id_fkey"
                        columns: ["author_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            api_retry_queue: {
                Row: {
                    created_at: string
                    id: string
                    payload: Json
                    retry_count: number
                    status: string
                    visitor_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    payload: Json
                    retry_count?: number
                    status?: string
                    visitor_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    payload?: Json
                    retry_count?: number
                    status?: string
                    visitor_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "api_retry_queue_visitor_id_fkey"
                        columns: ["visitor_id"]
                        isOneToOne: false
                        referencedRelation: "visitors"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    actor_id: string | null
                    created_at: string
                    details: Json | null
                    id: string
                }
                Insert: {
                    action: string
                    actor_id?: string | null
                    created_at?: string
                    details?: Json | null
                    id?: string
                }
                Update: {
                    action?: string
                    actor_id?: string | null
                    created_at?: string
                    details?: Json | null
                    id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_actor_id_fkey"
                        columns: ["actor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string
                    email: string | null
                    full_name: string | null
                    id: string
                    role: Database["public"]["Enums"]["user_role"]
                    unit_id: string | null
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: Database["public"]["Enums"]["user_role"]
                    unit_id?: string | null
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    unit_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                ]
            }
            units: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    type: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    type: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    type?: string
                }
                Relationships: []
            }
            visitors: {
                Row: {
                    access_date: string
                    created_at: string
                    credential_number: number
                    id: string
                    needs_parking: boolean
                    owner_id: string
                    pin_code: string
                    status: string
                    unit_id: string
                    visitor_email: string | null
                    visitor_name: string
                }
                Insert: {
                    access_date: string
                    created_at?: string
                    credential_number: number
                    id?: string
                    needs_parking?: boolean
                    owner_id: string
                    pin_code: string
                    status?: string
                    unit_id: string
                    visitor_email?: string | null
                    visitor_name: string
                }
                Update: {
                    access_date?: string
                    created_at?: string
                    credential_number?: number
                    id?: string
                    needs_parking?: boolean
                    owner_id?: string
                    pin_code?: string
                    status?: string
                    unit_id?: string
                    visitor_email?: string | null
                    visitor_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "visitors_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitors_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: "super_admin" | "group_admin" | "guard"
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
            user_role: ["super_admin", "group_admin", "guard"],
        },
    },
} as const
