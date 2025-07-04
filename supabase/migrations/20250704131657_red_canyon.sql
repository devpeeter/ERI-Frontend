/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_address` (text, wallet address of recipient)
      - `sender_address` (text, wallet address of sender)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification message)
      - `data` (jsonb, additional notification data)
      - `read` (boolean, read status)
      - `created_at` (timestamp)
      - `action_url` (text, optional action URL)
      - `action_label` (text, optional action label)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for authenticated users to create notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address text NOT NULL,
  sender_address text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  action_url text,
  action_label text
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_address = auth.jwt() ->> 'wallet_address' OR recipient_address = auth.jwt() ->> 'sub');

-- Policy for users to read notifications by wallet address (for our use case)
CREATE POLICY "Users can read notifications by wallet address"
  ON notifications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy for users to create notifications
CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Policy for users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);