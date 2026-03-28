/**
 * Tipos alineados al schema StrongBox (HackITBA 2026).
 * Regenerar con `supabase gen types typescript --linked` cuando haya acceso al proyecto.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TxType = 'deposit' | 'withdraw' | 'recovery';
export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';
export type WithdrawalStatus = 'pending_approval' | 'approved' | 'executed' | 'cancelled' | 'expired';
export type RecoveryState = 'inactive' | 'pending' | 'executed';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          display_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          display_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Relationships: [];
      };
      strongboxes: {
        Row: {
          id: string;
          user_id: string;
          contract_address: string | null;
          chain_id: number;
          balance_native: string | null;
          time_limit_seconds: number;
          last_activity_at: string;
          recovery_state: RecoveryState;
          recovery_unlocks_at: string | null;
          is_deployed: boolean;
          deploy_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contract_address?: string | null;
          chain_id?: number;
          balance_native?: string | null;
          time_limit_seconds?: number;
          last_activity_at?: string;
          recovery_state?: RecoveryState;
          recovery_unlocks_at?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contract_address?: string | null;
          chain_id?: number;
          balance_native?: string | null;
          time_limit_seconds?: number;
          last_activity_at?: string;
          recovery_state?: RecoveryState;
          recovery_unlocks_at?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guardians: {
        Row: {
          id: string;
          strongbox_id: string;
          slot: number;
          address: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          strongbox_id: string;
          slot: number;
          address: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          strongbox_id?: string;
          slot?: number;
          address?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recovery_contacts: {
        Row: {
          id: string;
          strongbox_id: string;
          slot: number;
          address: string;
          email: string | null;
          display_name: string | null;
          share_percentage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          strongbox_id: string;
          slot: number;
          address: string;
          email?: string | null;
          display_name?: string | null;
          share_percentage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          strongbox_id?: string;
          slot?: number;
          address?: string;
          email?: string | null;
          display_name?: string | null;
          share_percentage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      withdrawal_requests: {
        Row: {
          id: string;
          strongbox_id: string;
          on_chain_request_id: number | null;
          amount: string;
          to_address: string;
          status: WithdrawalStatus;
          guardian1_approved: boolean;
          guardian2_approved: boolean;
          guardian1_approved_at: string | null;
          guardian2_approved_at: string | null;
          executed_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          strongbox_id: string;
          on_chain_request_id?: number | null;
          amount: string;
          to_address: string;
          status?: WithdrawalStatus;
          guardian1_approved?: boolean;
          guardian2_approved?: boolean;
          guardian1_approved_at?: string | null;
          guardian2_approved_at?: string | null;
          executed_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          strongbox_id?: string;
          on_chain_request_id?: number | null;
          amount?: string;
          to_address?: string;
          status?: WithdrawalStatus;
          guardian1_approved?: boolean;
          guardian2_approved?: boolean;
          guardian1_approved_at?: string | null;
          guardian2_approved_at?: string | null;
          executed_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          strongbox_id: string | null;
          tx_type: TxType;
          status: TxStatus;
          chain_id: number;
          tx_hash: string | null;
          from_address: string;
          to_address: string;
          amount: string;
          gas_used: string | null;
          error_message: string | null;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          strongbox_id?: string | null;
          tx_type: TxType;
          status?: TxStatus;
          chain_id?: number;
          tx_hash?: string | null;
          from_address: string;
          to_address: string;
          amount: string;
          gas_used?: string | null;
          error_message?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          strongbox_id?: string | null;
          tx_type?: TxType;
          status?: TxStatus;
          chain_id?: number;
          tx_hash?: string | null;
          from_address?: string;
          to_address?: string;
          amount?: string;
          gas_used?: string | null;
          error_message?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          priority: AlertPriority;
          title: string;
          message: string;
          category: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          priority?: AlertPriority;
          title: string;
          message: string;
          category: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          priority?: AlertPriority;
          title?: string;
          message?: string;
          category?: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_dashboard: {
        Row: {
          user_id: string | null;
          wallet_address: string | null;
          last_active_at: string | null;
          strongbox_address: string | null;
          balance_native: string | null;
          time_limit_seconds: number | null;
          strongbox_last_activity: string | null;
          recovery_state: RecoveryState | null;
          is_deployed: boolean | null;
          pending_withdrawals: number | null;
          unread_alerts: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      tx_type: TxType;
      tx_status: TxStatus;
      withdrawal_status: WithdrawalStatus;
      recovery_state: RecoveryState;
      alert_priority: AlertPriority;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type PublicUserRow = Database['public']['Tables']['users']['Row'];
export type PublicProfile = Pick<
  PublicUserRow,
  'id' | 'wallet_address' | 'display_name' | 'email' | 'created_at' | 'updated_at' | 'last_active_at'
>;
export type StrongboxRow = Database['public']['Tables']['strongboxes']['Row'];
export type GuardianRow = Database['public']['Tables']['guardians']['Row'];
export type RecoveryContactRow = Database['public']['Tables']['recovery_contacts']['Row'];
export type WithdrawalRequestRow = Database['public']['Tables']['withdrawal_requests']['Row'];
