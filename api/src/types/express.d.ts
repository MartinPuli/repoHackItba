import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      /** Seteado por `requireAuth`: Supabase Auth `user.id` === `public.users.id`. */
      authUserId?: string;
      /** Seteado por `requireAuth`: `auth.getUser(jwt)`. */
      authUser?: User;
    }
  }
}

export {};
