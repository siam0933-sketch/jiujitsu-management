-- Create gym_messages table for 1:1 messaging between gym master and members

CREATE TABLE gym_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('admin', 'member')),
  body TEXT NOT NULL,
  is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_read_by_member BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gym_messages_gym_member_idx ON gym_messages (gym_id, member_id, created_at DESC);

ALTER TABLE gym_messages ENABLE ROW LEVEL SECURITY;

-- Service role (admin client) bypasses RLS automatically
-- No additional policies needed for server-side admin client access
