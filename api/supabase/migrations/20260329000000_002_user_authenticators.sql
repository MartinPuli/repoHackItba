CREATE TABLE public.user_authenticators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_authenticators_pkey PRIMARY KEY (id),
  CONSTRAINT user_authenticators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_authenticators_user_id ON public.user_authenticators(user_id);
CREATE INDEX idx_user_authenticators_credential_id ON public.user_authenticators(credential_id);
