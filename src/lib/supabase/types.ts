export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string
          description: string | null
          timezone: string
          status: 'active' | 'archived' | 'pending' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain: string
          description?: string | null
          timezone?: string
          status?: 'active' | 'archived' | 'pending' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string
          description?: string | null
          timezone?: string
          status?: 'active' | 'archived' | 'pending' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          site_id: string
          name: string
          key_prefix: string | null
          key_hash: string
          status: 'active' | 'revoked' | 'expired'
          expires_at: string | null
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          name: string
          key_prefix?: string | null
          key_hash: string
          status?: 'active' | 'revoked' | 'expired'
          expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          key_prefix?: string | null
          key_hash?: string
          status?: 'active' | 'revoked' | 'expired'
          expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'api_keys_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      visitors: {
        Row: {
          id: string
          site_id: string
          visitor_uid: string
          identified_user: string | null
          first_seen_at: string
          last_seen_at: string
          total_sessions: number
          total_page_views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          visitor_uid: string
          identified_user?: string | null
          first_seen_at?: string
          last_seen_at?: string
          total_sessions?: number
          total_page_views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          visitor_uid?: string
          identified_user?: string | null
          first_seen_at?: string
          last_seen_at?: string
          total_sessions?: number
          total_page_views?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'visitors_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          site_id: string
          visitor_id: string
          session_uid: string
          started_at: string
          last_activity_at: string
          duration_seconds: number
          landing_page: string
          exit_page: string
          page_count: number
          referrer: string | null
          country: string
          country_code: string
          device_type: string
          browser: string
          operating_system: string
          is_online: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          visitor_id: string
          session_uid: string
          started_at?: string
          last_activity_at?: string
          duration_seconds?: number
          landing_page: string
          exit_page?: string
          page_count?: number
          referrer?: string | null
          country?: string
          country_code?: string
          device_type?: string
          browser?: string
          operating_system?: string
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          visitor_id?: string
          session_uid?: string
          started_at?: string
          last_activity_at?: string
          duration_seconds?: number
          landing_page?: string
          exit_page?: string
          page_count?: number
          referrer?: string | null
          country?: string
          country_code?: string
          device_type?: string
          browser?: string
          operating_system?: string
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sessions_visitor_id_fkey'
            columns: ['visitor_id']
            isOneToOne: false
            referencedRelation: 'visitors'
            referencedColumns: ['id']
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          site_id: string
          visitor_id: string
          session_id: string
          page_order: number
          url: string
          path: string
          query_string: string | null
          hash_fragment: string | null
          title: string
          referrer: string | null
          entered_at: string
          left_at: string | null
          duration_seconds: number | null
          scroll_depth: number | null
          is_exit_page: boolean
        }
        Insert: {
          id?: string
          site_id: string
          visitor_id: string
          session_id: string
          page_order: number
          url: string
          path: string
          query_string?: string | null
          hash_fragment?: string | null
          title: string
          referrer?: string | null
          entered_at?: string
          left_at?: string | null
          duration_seconds?: number | null
          scroll_depth?: number | null
          is_exit_page?: boolean
        }
        Update: {
          id?: string
          site_id?: string
          visitor_id?: string
          session_id?: string
          page_order?: number
          url?: string
          path?: string
          query_string?: string | null
          hash_fragment?: string | null
          title?: string
          referrer?: string | null
          entered_at?: string
          left_at?: string | null
          duration_seconds?: number | null
          scroll_depth?: number | null
          is_exit_page?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'page_views_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'page_views_visitor_id_fkey'
            columns: ['visitor_id']
            isOneToOne: false
            referencedRelation: 'visitors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'page_views_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          id: string
          site_id: string
          visitor_id: string
          session_id: string
          page_view_id: string | null
          event_name: string
          event_category: string
          event_action: string | null
          event_label: string | null
          event_value: number | null
          target_selector: string | null
          target_text: string | null
          target_href: string | null
          x_position: number | null
          y_position: number | null
          scroll_percent: number | null
          metadata: Json | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          visitor_id: string
          session_id: string
          page_view_id?: string | null
          event_name: string
          event_category?: string
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          target_selector?: string | null
          target_text?: string | null
          target_href?: string | null
          x_position?: number | null
          y_position?: number | null
          scroll_percent?: number | null
          metadata?: Json | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          visitor_id?: string
          session_id?: string
          page_view_id?: string | null
          event_name?: string
          event_category?: string
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          target_selector?: string | null
          target_text?: string | null
          target_href?: string | null
          x_position?: number | null
          y_position?: number | null
          scroll_percent?: number | null
          metadata?: Json | null
          occurred_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_visitor_id_fkey'
            columns: ['visitor_id']
            isOneToOne: false
            referencedRelation: 'visitors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_page_view_id_fkey'
            columns: ['page_view_id']
            isOneToOne: false
            referencedRelation: 'page_views'
            referencedColumns: ['id']
          },
        ]
      }
      allowed_domains: {
        Row: {
          id: string
          site_id: string
          domain: string
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          domain: string
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          domain?: string
          is_verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'allowed_domains_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ==============================================================================
// GENERATED TABLE TYPE ALIASES — single source of truth for Row / Insert / Update
// ==============================================================================

export type PublicTables = Database['public']['Tables']

export type SitesRow = PublicTables['sites']['Row']
export type SitesInsert = PublicTables['sites']['Insert']
export type SitesUpdate = PublicTables['sites']['Update']

export type ApiKeysRow = PublicTables['api_keys']['Row']
export type ApiKeysInsert = PublicTables['api_keys']['Insert']
export type ApiKeysUpdate = PublicTables['api_keys']['Update']

export type VisitorsRow = PublicTables['visitors']['Row']
export type VisitorsInsert = PublicTables['visitors']['Insert']
export type VisitorsUpdate = PublicTables['visitors']['Update']

export type SessionsRow = PublicTables['sessions']['Row']
export type SessionsInsert = PublicTables['sessions']['Insert']
export type SessionsUpdate = PublicTables['sessions']['Update']

export type PageViewsRow = PublicTables['page_views']['Row']
export type PageViewsInsert = PublicTables['page_views']['Insert']
export type PageViewsUpdate = PublicTables['page_views']['Update']

export type EventsRow = PublicTables['events']['Row']
export type EventsInsert = PublicTables['events']['Insert']
export type EventsUpdate = PublicTables['events']['Update']

export type AllowedDomainsRow = PublicTables['allowed_domains']['Row']
export type AllowedDomainsInsert = PublicTables['allowed_domains']['Insert']
export type AllowedDomainsUpdate = PublicTables['allowed_domains']['Update']

/** Derived from sites.Row.status — do not redefine */
export type SiteStatus = SitesRow['status']
/** Derived from api_keys.Row.status — do not redefine */
export type ApiKeyStatus = ApiKeysRow['status']
/** Derived from sessions.Row.device_type — schema stores as string */
export type DeviceType = SessionsRow['device_type']

/** Backward-compatible aliases used across repositories / services */
export type DbSite = SitesRow
export type DbApiKey = ApiKeysRow
export type DbVisitor = VisitorsRow
export type DbSession = SessionsRow
export type DbPageView = PageViewsRow
export type DbEvent = EventsRow
export type DbAllowedDomain = AllowedDomainsRow
