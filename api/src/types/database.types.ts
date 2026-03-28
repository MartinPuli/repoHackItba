/**
 * Tipos alineados al schema Smart Wallet (HackITBA 2026).
 * Regenerar con `supabase gen types typescript --linked` cuando haya acceso al proyecto.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AutonomyLevel = 'asistente' | 'copiloto' | 'autonomo';
export type TxType =
  | 'deposit'
  | 'withdraw'
  | 'send'
  | 'swap'
  | 'yield_deposit'
  | 'yield_withdraw'
  | 'bridge'
  | 'off_ramp';
export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';
export type AgentActionType =
  | 'analysis'
  | 'suggestion'
  | 'prepare_tx'
  | 'execute_tx'
  | 'compliance_check'
  | 'rebalance'
  | 'yield_optimize'
  | 'reset_deadman'
  | 'alert';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecoveryState = 'inactive' | 'pending' | 'executed';
export type SessionKeyStatus = 'active' | 'expired' | 'revoked';
export type HerederoRol = 'guardian' | 'heir';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          email: string | null;
          autonomy_level: AutonomyLevel;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          display_name?: string | null;
          email?: string | null;
          autonomy_level?: AutonomyLevel;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          display_name?: string | null;
          email?: string | null;
          autonomy_level?: AutonomyLevel;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          contract_address: string;
          chain_id: number;
          balance_bnb: string | null;
          balance_usdt: string | null;
          balance_btcb: string | null;
          is_deployed: boolean;
          deploy_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contract_address: string;
          chain_id?: number;
          balance_bnb?: string | null;
          balance_usdt?: string | null;
          balance_btcb?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contract_address?: string;
          chain_id?: number;
          balance_bnb?: string | null;
          balance_usdt?: string | null;
          balance_btcb?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      caja_fuerte: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          contract_address: string | null;
          chain_id: number;
          balance_usdt: string | null;
          balance_btcb: string | null;
          balance_rbtc: string | null;
          dead_man_timeout_seconds: number;
          last_activity_at: string;
          recovery_state: RecoveryState;
          withdrawal_unlocks_at: string | null;
          is_deployed: boolean;
          deploy_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          contract_address?: string | null;
          chain_id?: number;
          balance_usdt?: string | null;
          balance_btcb?: string | null;
          balance_rbtc?: string | null;
          dead_man_timeout_seconds?: number;
          last_activity_at?: string;
          recovery_state?: RecoveryState;
          withdrawal_unlocks_at?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string | null;
          contract_address?: string | null;
          chain_id?: number;
          balance_usdt?: string | null;
          balance_btcb?: string | null;
          balance_rbtc?: string | null;
          dead_man_timeout_seconds?: number;
          last_activity_at?: string;
          recovery_state?: RecoveryState;
          withdrawal_unlocks_at?: string | null;
          is_deployed?: boolean;
          deploy_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      herederos: {
        Row: {
          id: string;
          caja_fuerte_id: string;
          slot: number;
          rol: HerederoRol;
          address: string;
          email: string | null;
          display_name: string | null;
          share_percentage: string;
          nonce: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caja_fuerte_id: string;
          slot: number;
          rol: HerederoRol;
          address: string;
          email?: string | null;
          display_name?: string | null;
          share_percentage?: string;
          nonce?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caja_fuerte_id?: string;
          slot?: number;
          rol?: HerederoRol;
          address?: string;
          email?: string | null;
          display_name?: string | null;
          share_percentage?: string;
          nonce?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          caja_fuerte_id: string | null;
          tx_type: TxType;
          status: TxStatus;
          chain_id: number;
          tx_hash: string | null;
          from_address: string;
          to_address: string;
          token_symbol: string;
          amount: string;
          amount_usd: string | null;
          gas_used: string | null;
          gas_cost_usd: string | null;
          initiated_by: string;
          agent_decision_id: string | null;
          error_message: string | null;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          caja_fuerte_id?: string | null;
          tx_type: TxType;
          status?: TxStatus;
          chain_id?: number;
          tx_hash?: string | null;
          from_address: string;
          to_address: string;
          token_symbol?: string;
          amount: string;
          amount_usd?: string | null;
          gas_used?: string | null;
          gas_cost_usd?: string | null;
          initiated_by?: string;
          agent_decision_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string | null;
          caja_fuerte_id?: string | null;
          tx_type?: TxType;
          status?: TxStatus;
          chain_id?: number;
          tx_hash?: string | null;
          from_address?: string;
          to_address?: string;
          token_symbol?: string;
          amount?: string;
          amount_usd?: string | null;
          gas_used?: string | null;
          gas_cost_usd?: string | null;
          initiated_by?: string;
          agent_decision_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
      session_keys: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          key_address: string;
          status: SessionKeyStatus;
          max_amount_per_tx: string;
          max_amount_cumulative: string;
          amount_spent: string;
          allowed_functions: string[];
          allowed_contracts: string[];
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          key_address: string;
          status?: SessionKeyStatus;
          max_amount_per_tx: string;
          max_amount_cumulative: string;
          amount_spent?: string;
          allowed_functions?: string[];
          allowed_contracts: string[];
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string;
          key_address?: string;
          status?: SessionKeyStatus;
          max_amount_per_tx?: string;
          max_amount_cumulative?: string;
          amount_spent?: string;
          allowed_functions?: string[];
          allowed_contracts?: string[];
          expires_at?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      yield_positions: {
        Row: {
          id: string;
          user_id: string;
          caja_fuerte_id: string;
          protocol: string;
          chain_id: number;
          pool_address: string | null;
          position_type: string;
          token_symbol: string;
          amount: string;
          amount_usd: string | null;
          apy_current: string | null;
          ltv_ratio: string | null;
          is_active: boolean;
          opened_at: string;
          closed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          caja_fuerte_id: string;
          protocol: string;
          chain_id: number;
          pool_address?: string | null;
          position_type: string;
          token_symbol: string;
          amount: string;
          amount_usd?: string | null;
          apy_current?: string | null;
          ltv_ratio?: string | null;
          is_active?: boolean;
          opened_at?: string;
          closed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          caja_fuerte_id?: string;
          protocol?: string;
          chain_id?: number;
          pool_address?: string | null;
          position_type?: string;
          token_symbol?: string;
          amount?: string;
          amount_usd?: string | null;
          apy_current?: string | null;
          ltv_ratio?: string | null;
          is_active?: boolean;
          opened_at?: string;
          closed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_decisions: {
        Row: {
          id: string;
          user_id: string;
          action_type: AgentActionType;
          autonomy_level: AutonomyLevel;
          hypothesis: Json | null;
          reasoning: string;
          evidence: Json | null;
          confidence: string | null;
          reflection_result: string | null;
          reflection_reasoning: string | null;
          final_action: string | null;
          tx_hash: string | null;
          outcome: Json | null;
          copper_votes: Json | null;
          execution_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: AgentActionType;
          autonomy_level: AutonomyLevel;
          hypothesis?: Json | null;
          reasoning: string;
          evidence?: Json | null;
          confidence?: string | null;
          reflection_result?: string | null;
          reflection_reasoning?: string | null;
          final_action?: string | null;
          tx_hash?: string | null;
          outcome?: Json | null;
          copper_votes?: Json | null;
          execution_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: AgentActionType;
          autonomy_level?: AutonomyLevel;
          hypothesis?: Json | null;
          reasoning?: string;
          evidence?: Json | null;
          confidence?: string | null;
          reflection_result?: string | null;
          reflection_reasoning?: string | null;
          final_action?: string | null;
          tx_hash?: string | null;
          outcome?: Json | null;
          copper_votes?: Json | null;
          execution_time_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      knowledge_base: {
        Row: {
          id: string;
          category: string;
          pattern: string;
          lesson: string;
          source_decision_id: string | null;
          confidence_weight: string | null;
          times_applied: number | null;
          success_rate: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          pattern: string;
          lesson: string;
          source_decision_id?: string | null;
          confidence_weight?: string | null;
          times_applied?: number | null;
          success_rate?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          pattern?: string;
          lesson?: string;
          source_decision_id?: string | null;
          confidence_weight?: string | null;
          times_applied?: number | null;
          success_rate?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      compliance_logs: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          regulation: string;
          check_type: string;
          passed: boolean;
          details: Json | null;
          flagged: boolean | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          regulation: string;
          check_type: string;
          passed: boolean;
          details?: Json | null;
          flagged?: boolean | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_id?: string | null;
          regulation?: string;
          check_type?: string;
          passed?: boolean;
          details?: Json | null;
          flagged?: boolean | null;
          reviewed_at?: string | null;
          created_at?: string;
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
          action_url: string | null;
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
          action_url?: string | null;
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
          action_url?: string | null;
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
          autonomy_level: AutonomyLevel | null;
          last_active_at: string | null;
          wallet_address_contract: string | null;
          wallet_bnb: string | null;
          wallet_usdt: string | null;
          caja_fuerte_address: string | null;
          caja_usdt: string | null;
          caja_rbtc: string | null;
          dead_man_timeout_seconds: number | null;
          deadman_last_activity: string | null;
          recovery_state: RecoveryState | null;
          active_session_keys: number | null;
          unread_alerts: number | null;
          total_yield_usd: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      expire_session_keys: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      autonomy_level: AutonomyLevel;
      tx_type: TxType;
      tx_status: TxStatus;
      agent_action_type: AgentActionType;
      alert_priority: AlertPriority;
      recovery_state: RecoveryState;
      session_key_status: SessionKeyStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type PublicUserRow = Database['public']['Tables']['users']['Row'];
export type PublicProfile = Pick<
  PublicUserRow,
  | 'id'
  | 'wallet_address'
  | 'display_name'
  | 'email'
  | 'autonomy_level'
  | 'created_at'
  | 'updated_at'
  | 'last_active_at'
>;
