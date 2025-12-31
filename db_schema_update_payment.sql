-- Add payment related columns to gym_members
-- payment_due_day: Integer (1-31), preferred day of payment
-- payment_end_date: Date, when the current payment expires (paid until)

alter table gym_members add column if not exists payment_due_day integer;
alter table gym_members add column if not exists payment_end_date date;

-- Optional: Comments for clarity
comment on column gym_members.payment_due_day is 'Preferred day of month for payment (1-31)';
comment on column gym_members.payment_end_date is 'Date until which the membership is paid';
