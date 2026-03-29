-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  priority USER-DEFINED NOT NULL DEFAULT 'medium'::alert_priority,
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.guardians (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  strongbox_id uuid NOT NULL,
  slot smallint NOT NULL CHECK (slot = ANY (ARRAY[1, 2])),
  address text NOT NULL,
  email text,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_strongbox_id_fkey FOREIGN KEY (strongbox_id) REFERENCES public.strongboxes(id)
);
CREATE TABLE public.recovery_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  strongbox_id uuid NOT NULL,
  slot smallint NOT NULL CHECK (slot = ANY (ARRAY[1, 2])),
  address text NOT NULL,
  email text,
  display_name text,
  share_percentage numeric NOT NULL DEFAULT 50.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recovery_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT recovery_contacts_strongbox_id_fkey FOREIGN KEY (strongbox_id) REFERENCES public.strongboxes(id)
);
CREATE TABLE public.strongboxes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  contract_address text UNIQUE,
  chain_id integer NOT NULL DEFAULT 97,
  balance_native numeric DEFAULT 0,
  time_limit_seconds integer NOT NULL DEFAULT 31536000,
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  recovery_state USER-DEFINED NOT NULL DEFAULT 'inactive'::recovery_state,
  recovery_unlocks_at timestamp with time zone,
  is_deployed boolean NOT NULL DEFAULT false,
  deploy_tx_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT strongboxes_pkey PRIMARY KEY (id),
  CONSTRAINT strongboxes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  strongbox_id uuid,
  tx_type USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::tx_status,
  chain_id integer NOT NULL DEFAULT 97,
  tx_hash text,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  gas_used numeric,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_strongbox_id_fkey FOREIGN KEY (strongbox_id) REFERENCES public.strongboxes(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  wallet_address text NOT NULL UNIQUE,
  display_name text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  strongbox_id uuid NOT NULL,
  on_chain_request_id integer,
  amount numeric NOT NULL,
  to_address text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending_approval'::withdrawal_status,
  guardian1_approved boolean NOT NULL DEFAULT false,
  guardian2_approved boolean NOT NULL DEFAULT false,
  guardian1_approved_at timestamp with time zone,
  guardian2_approved_at timestamp with time zone,
  executed_tx_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawal_requests_strongbox_id_fkey FOREIGN KEY (strongbox_id) REFERENCES public.strongboxes(id)
);