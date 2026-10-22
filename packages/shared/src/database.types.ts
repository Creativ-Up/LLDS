// Généré par `pnpm db:types` (supabase gen types) — ne pas modifier.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": number,"kind": string,"payload": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"kind": string,"payload"?: NonNullable<Json>
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"kind"?: string,"payload"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"app_settings": {
                  Row: {
                    "bike_kmh": number,"car_kmh": number,"default_geofence_radius_m": number,"default_guest_preview_s": number,"id": boolean,"updated_at": string,"walk_kmh": number
                  }
                  ComputedFields: never
                  Insert: {
                    "bike_kmh"?: number,"car_kmh"?: number,"default_geofence_radius_m"?: number,"default_guest_preview_s"?: number,"id"?: boolean,"updated_at"?: string,"walk_kmh"?: number
                  }
                  Update: {
                    "bike_kmh"?: number,"car_kmh"?: number,"default_geofence_radius_m"?: number,"default_guest_preview_s"?: number,"id"?: boolean,"updated_at"?: string,"walk_kmh"?: number
                  }
                  Relationships: [
                    
                  ]
                },"line_progress": {
                  Row: {
                    "completed_at": string | null,"direction": Database["public"]['Enums']["line_direction"],"line_id": string,"started_at": string,"status": Database["public"]['Enums']["progress_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"direction"?: Database["public"]['Enums']["line_direction"],"line_id": string,"started_at"?: string,"status"?: Database["public"]['Enums']["progress_status"],"user_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"direction"?: Database["public"]['Enums']["line_direction"],"line_id"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["progress_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "line_progress_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "line_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "line_progress_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "lines"
      referencedColumns: ["id"]
    }
                  ]
                },"lines": {
                  Row: {
                    "code": string,"content_version": number,"cover_media_id": string | null,"created_at": string,"id": string,"length_m": number | null,"name": NonNullable<Json>,"published_at": string | null,"sort_order": number,"status": Database["public"]['Enums']["line_status"],"tagline": NonNullable<Json>,"track": unknown,"track_source_name": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"content_version"?: number,"cover_media_id"?: string | null,"created_at"?: string,"id"?: string,"length_m"?: number | null,"name"?: NonNullable<Json>,"published_at"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["line_status"],"tagline"?: NonNullable<Json>,"track"?: unknown,"track_source_name"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"content_version"?: number,"cover_media_id"?: string | null,"created_at"?: string,"id"?: string,"length_m"?: number | null,"name"?: NonNullable<Json>,"published_at"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["line_status"],"tagline"?: NonNullable<Json>,"track"?: unknown,"track_source_name"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lines_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"media": {
                  Row: {
                    "bucket": Database["public"]['Enums']["media_bucket"],"created_at": string,"credit": string | null,"duration_s": number | null,"height": number | null,"id": string,"mime": string,"original_name": string | null,"path": string,"sha256": string | null,"size_bytes": number,"updated_at": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": Database["public"]['Enums']["media_bucket"],"created_at"?: string,"credit"?: string | null,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"mime": string,"original_name"?: string | null,"path": string,"sha256"?: string | null,"size_bytes": number,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "bucket"?: Database["public"]['Enums']["media_bucket"],"created_at"?: string,"credit"?: string | null,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"mime"?: string,"original_name"?: string | null,"path"?: string,"sha256"?: string | null,"size_bytes"?: number,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"offer_unlocks": {
                  Row: {
                    "offer_id": string,"unlocked_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "offer_id": string,"unlocked_at"?: string,"user_id": string
                  }
                  Update: {
                    "offer_id"?: string,"unlocked_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "offer_unlocks_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "offers"
      referencedColumns: ["id"]
    }
                  ]
                },"offers": {
                  Row: {
                    "active": boolean,"conditions": NonNullable<Json>,"created_at": string,"description": NonNullable<Json>,"id": string,"partner_id": string,"required_stamp_id": string | null,"title": NonNullable<Json>,"updated_at": string,"valid_from": string | null,"valid_until": string | null,"visible_from_stop_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"conditions"?: NonNullable<Json>,"created_at"?: string,"description"?: NonNullable<Json>,"id"?: string,"partner_id": string,"required_stamp_id"?: string | null,"title"?: NonNullable<Json>,"updated_at"?: string,"valid_from"?: string | null,"valid_until"?: string | null,"visible_from_stop_id"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"conditions"?: NonNullable<Json>,"created_at"?: string,"description"?: NonNullable<Json>,"id"?: string,"partner_id"?: string,"required_stamp_id"?: string | null,"title"?: NonNullable<Json>,"updated_at"?: string,"valid_from"?: string | null,"valid_until"?: string | null,"visible_from_stop_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "offers_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_required_stamp_id_fkey"
      columns: ["required_stamp_id"]
isOneToOne: false
      referencedRelation: "stamps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_visible_from_stop_id_fkey"
      columns: ["visible_from_stop_id"]
isOneToOne: false
      referencedRelation: "stop_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "offers_visible_from_stop_id_fkey"
      columns: ["visible_from_stop_id"]
isOneToOne: false
      referencedRelation: "stops"
      referencedColumns: ["id"]
    }
                  ]
                },"partners": {
                  Row: {
                    "address": string | null,"city": string | null,"created_at": string,"id": string,"logo_media_id": string | null,"name": string,"opening_hours": NonNullable<Json>,"photo_media_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string,"id"?: string,"logo_media_id"?: string | null,"name": string,"opening_hours"?: NonNullable<Json>,"photo_media_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string,"id"?: string,"logo_media_id"?: string | null,"name"?: string,"opening_hours"?: NonNullable<Json>,"photo_media_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "partners_logo_media_id_fkey"
      columns: ["logo_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "partners_photo_media_id_fkey"
      columns: ["photo_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"experience": Database["public"]['Enums']["experience_type"] | null,"first_name": string | null,"id": string,"lang": Database["public"]['Enums']["lang_code"],"role": Database["public"]['Enums']["user_role"],"text_size": Database["public"]['Enums']["text_size"],"transport": Database["public"]['Enums']["transport_mode"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"experience"?: Database["public"]['Enums']["experience_type"] | null,"first_name"?: string | null,"id": string,"lang"?: Database["public"]['Enums']["lang_code"],"role"?: Database["public"]['Enums']["user_role"],"text_size"?: Database["public"]['Enums']["text_size"],"transport"?: Database["public"]['Enums']["transport_mode"] | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"experience"?: Database["public"]['Enums']["experience_type"] | null,"first_name"?: string | null,"id"?: string,"lang"?: Database["public"]['Enums']["lang_code"],"role"?: Database["public"]['Enums']["user_role"],"text_size"?: Database["public"]['Enums']["text_size"],"transport"?: Database["public"]['Enums']["transport_mode"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stamps": {
                  Row: {
                    "created_at": string,"id": string,"image_media_id": string | null,"line_id": string | null,"name": NonNullable<Json>,"points_threshold": number | null,"rule": Database["public"]['Enums']["stamp_rule"],"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_media_id"?: string | null,"line_id"?: string | null,"name"?: NonNullable<Json>,"points_threshold"?: number | null,"rule"?: Database["public"]['Enums']["stamp_rule"],"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_media_id"?: string | null,"line_id"?: string | null,"name"?: NonNullable<Json>,"points_threshold"?: number | null,"rule"?: Database["public"]['Enums']["stamp_rule"],"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stamps_image_media_id_fkey"
      columns: ["image_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamps_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "line_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stamps_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "lines"
      referencedColumns: ["id"]
    }
                  ]
                },"stop_completions": {
                  Row: {
                    "completed_at": string,"points_awarded": number,"stop_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"points_awarded"?: number,"stop_id": string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string,"points_awarded"?: number,"stop_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stop_completions_stop_id_fkey"
      columns: ["stop_id"]
isOneToOne: false
      referencedRelation: "stop_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stop_completions_stop_id_fkey"
      columns: ["stop_id"]
isOneToOne: false
      referencedRelation: "stops"
      referencedColumns: ["id"]
    }
                  ]
                },"stop_media": {
                  Row: {
                    "kind": Database["public"]['Enums']["stop_media_kind"],"lang": Database["public"]['Enums']["lang_code"],"media_id": string,"stop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "kind": Database["public"]['Enums']["stop_media_kind"],"lang": Database["public"]['Enums']["lang_code"],"media_id": string,"stop_id": string
                  }
                  Update: {
                    "kind"?: Database["public"]['Enums']["stop_media_kind"],"lang"?: Database["public"]['Enums']["lang_code"],"media_id"?: string,"stop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stop_media_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stop_media_stop_id_fkey"
      columns: ["stop_id"]
isOneToOne: false
      referencedRelation: "stop_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stop_media_stop_id_fkey"
      columns: ["stop_id"]
isOneToOne: false
      referencedRelation: "stops"
      referencedColumns: ["id"]
    }
                  ]
                },"stops": {
                  Row: {
                    "archive_media_id": string | null,"created_at": string,"description": NonNullable<Json>,"geofence_radius_m": number,"guest_preview_s": number,"id": string,"line_id": string,"location": unknown,"name": NonNullable<Json>,"points": number,"position": number,"present_media_id": string | null,"requires_on_site": boolean,"services": (Database["public"]['Enums']["stop_service"])[],"stamp_id": string | null,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archive_media_id"?: string | null,"created_at"?: string,"description"?: NonNullable<Json>,"geofence_radius_m"?: number,"guest_preview_s"?: number,"id"?: string,"line_id": string,"location": unknown,"name"?: NonNullable<Json>,"points"?: number,"position": number,"present_media_id"?: string | null,"requires_on_site"?: boolean,"services"?: (Database["public"]['Enums']["stop_service"])[],"stamp_id"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "archive_media_id"?: string | null,"created_at"?: string,"description"?: NonNullable<Json>,"geofence_radius_m"?: number,"guest_preview_s"?: number,"id"?: string,"line_id"?: string,"location"?: unknown,"name"?: NonNullable<Json>,"points"?: number,"position"?: number,"present_media_id"?: string | null,"requires_on_site"?: boolean,"services"?: (Database["public"]['Enums']["stop_service"])[],"stamp_id"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stops_archive_media_id_fkey"
      columns: ["archive_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "line_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "lines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_present_media_id_fkey"
      columns: ["present_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_stamp_id_fkey"
      columns: ["stamp_id"]
isOneToOne: false
      referencedRelation: "stamps"
      referencedColumns: ["id"]
    }
                  ]
                },"user_stamps": {
                  Row: {
                    "awarded_at": string,"stamp_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_at"?: string,"stamp_id": string,"user_id": string
                  }
                  Update: {
                    "awarded_at"?: string,"stamp_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_stamps_stamp_id_fkey"
      columns: ["stamp_id"]
isOneToOne: false
      referencedRelation: "stamps"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "line_overview": {
                  Row: {
                    "code": string | null,"content_version": number | null,"cover_media_id": string | null,"created_at": string | null,"id": string | null,"length_m": number | null,"name": Json | null,"points_max": number | null,"published_at": string | null,"sort_order": number | null,"stamp_count": number | null,"status": Database["public"]['Enums']["line_status"] | null,"stop_count": number | null,"tagline": Json | null,"track_geojson": Json | null,"track_source_name": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "lines_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"line_stamps": {
                  Row: {
                    "line_id": string | null,"stamp_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"media_usages": {
                  Row: {
                    "kind": Database["public"]['Enums']["stop_media_kind"] | null,"lang": Database["public"]['Enums']["lang_code"] | null,"line_code": string | null,"line_id": string | null,"media_id": string | null,"partner_id": string | null,"partner_name": string | null,"stamp_id": string | null,"stamp_name": Json | null,"stop_id": string | null,"stop_name": Json | null,"usage": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"stop_overview": {
                  Row: {
                    "archive_media_id": string | null,"created_at": string | null,"description": Json | null,"geofence_radius_m": number | null,"guest_preview_s": number | null,"id": string | null,"lat": number | null,"line_id": string | null,"lng": number | null,"name": Json | null,"points": number | null,"position": number | null,"present_media_id": string | null,"requires_on_site": boolean | null,"services": (Database["public"]['Enums']["stop_service"])[] | null,"stamp_id": string | null,"updated_at": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "archive_media_id"?: string | null,"created_at"?: string | null,"description"?: Json | null,"geofence_radius_m"?: number | null,"guest_preview_s"?: number | null,"id"?: string | null,"lat"?: never,"line_id"?: string | null,"lng"?: never,"name"?: Json | null,"points"?: number | null,"position"?: number | null,"present_media_id"?: string | null,"requires_on_site"?: boolean | null,"services"?: (Database["public"]['Enums']["stop_service"])[] | null,"stamp_id"?: string | null,"updated_at"?: string | null,"year"?: number | null
                         }
                        Update: {
                           "archive_media_id"?: string | null,"created_at"?: string | null,"description"?: Json | null,"geofence_radius_m"?: number | null,"guest_preview_s"?: number | null,"id"?: string | null,"lat"?: never,"line_id"?: string | null,"lng"?: never,"name"?: Json | null,"points"?: number | null,"position"?: number | null,"present_media_id"?: string | null,"requires_on_site"?: boolean | null,"services"?: (Database["public"]['Enums']["stop_service"])[] | null,"stamp_id"?: string | null,"updated_at"?: string | null,"year"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "stops_archive_media_id_fkey"
      columns: ["archive_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "line_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_line_id_fkey"
      columns: ["line_id"]
isOneToOne: false
      referencedRelation: "lines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_present_media_id_fkey"
      columns: ["present_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stops_stamp_id_fkey"
      columns: ["stamp_id"]
isOneToOne: false
      referencedRelation: "stamps"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "add_stop":
{ Args: { "p_lat": number,"p_line_id": string,"p_lng": number }; Returns: string
                           },
"admin_delete_user":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"admin_incomplete_stops":
{ Args: Record<PropertyKey, never>; Returns: {
              "line_code": string,"line_id": string,"missing": (string)[],"stop_id": string,"stop_name": Json,"stop_position": number
            }[]
                           },
"admin_list_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"email": string,"first_name": string,"id": string,"lines": Json,"points": number,"stamps": number
            }[]
                           },
"assert_admin":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"default_geofence_radius_m":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"default_guest_preview_s":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"delete_stop":
{ Args: { "p_stop_id": string }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_i18n_text":
{ Args: { "value": Json }; Returns: boolean
                           },
"is_line_visible":
{ Args: { "p_line_id": string }; Returns: boolean
                           },
"is_media_public":
{ Args: { "p_media_id": string }; Returns: boolean
                           },
"is_stop_visible":
{ Args: { "p_stop_id": string }; Returns: boolean
                           },
"is_storage_object_public":
{ Args: { "p_bucket": string,"p_path": string }; Returns: boolean
                           },
"line_is_publishable":
{ Args: { "p_line_id": string }; Returns: boolean
                           },
"line_publication_issues":
{ Args: { "p_line_id": string }; Returns: {
              "blocking": boolean,"code": string,"missing": (string)[],"stop_id": string
            }[]
                           },
"log_admin_event":
{ Args: { "p_kind": string,"p_payload": Json }; Returns: undefined
                           },
"move_stop":
{ Args: { "p_lat": number,"p_lng": number,"p_stop_id": string }; Returns: {
              "lat": number,"lng": number
            }[]
                           },
"publish_line":
{ Args: { "p_line_id": string }; Returns: number
                           },
"reorder_lines":
{ Args: { "p_line_ids": (string)[] }; Returns: undefined
                           },
"reorder_stops":
{ Args: { "p_line_id": string,"p_stop_ids": (string)[] }; Returns: undefined
                           },
"set_line_track":
{ Args: { "p_geojson": Json,"p_line_id": string,"p_source_name": string }; Returns: number
                           },
"snap_to_track":
{ Args: { "p_lat": number,"p_line_id": string,"p_lng": number }; Returns: {
              "fraction": number,"lat": number,"lng": number
            }[]
                           },
"stop_missing_items":
{ Args: { "p_stop_id": string }; Returns: (string)[]
                           }
          }
          Enums: {
            "experience_type": "complete"|"audio","lang_code": "fr"|"nl"|"en","line_direction": "forward"|"backward","line_status": "draft"|"published"|"coming_soon","media_bucket": "media"|"media-public","progress_status": "in_progress"|"completed","stamp_rule": "stop_completed"|"line_completed"|"points_threshold","stop_media_kind": "video"|"audio"|"subtitles","stop_service": "cafe"|"parking"|"info"|"restaurant"|"gare"|"patrimoine"|"remise","text_size": "normal"|"large"|"xlarge","transport_mode": "pied"|"velo"|"voiture","user_role": "user"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "experience_type": ["complete", "audio"],"lang_code": ["fr", "nl", "en"],"line_direction": ["forward", "backward"],"line_status": ["draft", "published", "coming_soon"],"media_bucket": ["media", "media-public"],"progress_status": ["in_progress", "completed"],"stamp_rule": ["stop_completed", "line_completed", "points_threshold"],"stop_media_kind": ["video", "audio", "subtitles"],"stop_service": ["cafe", "parking", "info", "restaurant", "gare", "patrimoine", "remise"],"text_size": ["normal", "large", "xlarge"],"transport_mode": ["pied", "velo", "voiture"],"user_role": ["user", "admin"]
          }
        }
} as const
