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
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name?: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          created_at?: string
          last_login?: string | null
        }
      }
      technicians: {
        Row: {
          id: string
          name: string
          email: string | null
          specialty: string
          avatar_color: string
          active: boolean
          created_at: string
          password_hash: string | null
          username: string | null
          password_plain: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          specialty?: string
          avatar_color?: string
          active?: boolean
          created_at?: string
          password_hash?: string | null
          username?: string | null
          password_plain?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          specialty?: string
          avatar_color?: string
          active?: boolean
          created_at?: string
          password_hash?: string | null
          username?: string | null
          password_plain?: string | null
        }
      }
      devices: {
        Row: {
          id: string
          device_type: string
          serial_number: string
          customer_name: string
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          device_type: string
          serial_number: string
          customer_name: string
          model?: string
          created_at?: string
        }
        Update: {
          id?: string
          device_type?: string
          serial_number?: string
          customer_name?: string
          model?: string
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          device_id: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          serial_number: string | null
          product_type: string | null
          brand: string | null
          model: string | null
          model_number: string | null
          custom_code: string | null
          warranty_status: string | null
          customer_full_name: string | null
          customer_phone: string | null
          customer_extension: string | null
          customer_email: string | null
          customer_address: string | null
          billing_company_name: string | null
          billing_address: string | null
          billing_tax_office: string | null
          billing_tax_number: string | null
          invoice_number: string | null
          total_service_amount: number | null
          approved_labor_cost: number | null
          approved_service_cost: number | null
          won: boolean | null
          won_at: string | null
          won_hidden: boolean | null
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: string
          priority?: string
          device_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          serial_number?: string | null
          product_type?: string | null
          brand?: string | null
          model?: string | null
          model_number?: string | null
          custom_code?: string | null
          warranty_status?: string | null
          customer_full_name?: string | null
          customer_phone?: string | null
          customer_extension?: string | null
          customer_email?: string | null
          customer_address?: string | null
          billing_company_name?: string | null
          billing_address?: string | null
          billing_tax_office?: string | null
          billing_tax_number?: string | null
          invoice_number?: string | null
          total_service_amount?: number | null
          approved_labor_cost?: number | null
          approved_service_cost?: number | null
          won?: boolean | null
          won_at?: string | null
          won_hidden?: boolean | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: string
          priority?: string
          device_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          serial_number?: string | null
          product_type?: string | null
          brand?: string | null
          model?: string | null
          model_number?: string | null
          custom_code?: string | null
          warranty_status?: string | null
          customer_full_name?: string | null
          customer_phone?: string | null
          customer_extension?: string | null
          customer_email?: string | null
          customer_address?: string | null
          billing_company_name?: string | null
          billing_address?: string | null
          billing_tax_office?: string | null
          billing_tax_number?: string | null
          invoice_number?: string | null
          total_service_amount?: number | null
          approved_labor_cost?: number | null
          approved_service_cost?: number | null
          won?: boolean | null
          won_at?: string | null
          won_hidden?: boolean | null
        }
      }
      ticket_notes: {
        Row: {
          id: string
          ticket_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          content: string
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          content?: string
          created_by?: string
          created_at?: string
        }
      }
    }
  }
}

export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type Technician = Database['public']['Tables']['technicians']['Row']
export type Device = Database['public']['Tables']['devices']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketNote = Database['public']['Tables']['ticket_notes']['Row']

export type TicketWithRelations = Ticket & {
  devices: Device | null
  technicians: Technician | null
  ticket_notes?: TicketNote[]
}

export const TICKET_STATUSES = [
  'accepted_pending',
  'fault_diagnosis',
  'customer_approval',
  'under_repair',
  'ready_for_delivery',
  'invoicing',
  'delivery'
] as const
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const WARRANTY_STATUSES = ['in_warranty', 'out_of_warranty', 'unknown'] as const

export type TicketStatus = typeof TICKET_STATUSES[number]
export type TicketPriority = typeof TICKET_PRIORITIES[number]
export type WarrantyStatus = typeof WARRANTY_STATUSES[number]
