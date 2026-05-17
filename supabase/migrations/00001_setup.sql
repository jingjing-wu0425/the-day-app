-- 用户资料
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  nickname text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 日记录
CREATE TABLE day_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE day_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records_select" ON day_records FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_friend(user_id));
CREATE POLICY "records_insert" ON day_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "records_delete" ON day_records FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 片段
CREATE TABLE fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES day_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text','photo','voice','summary')),
  content text NOT NULL DEFAULT '',
  timestamp text NOT NULL,
  media_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fragments_select" ON fragments FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_friend(user_id));
CREATE POLICY "fragments_insert" ON fragments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fragments_update" ON fragments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "fragments_delete" ON fragments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 好友关系
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select" ON friendships FOR SELECT TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "friendships_insert" ON friendships FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "friendships_update" ON friendships FOR UPDATE TO authenticated USING (addressee_id = auth.uid());

-- 好友判断函数（RLS 使用）
CREATE OR REPLACE FUNCTION is_friend(other_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = auth.uid() AND addressee_id = other_id)
        OR (addressee_id = auth.uid() AND requester_id = other_id))
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
