-- Create gym_products table
create table if not exists gym_products (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) not null,
  name text not null,
  price integer not null default 0,
  display_order integer not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index if not exists idx_gym_products_gym_id on gym_products(gym_id);
create index if not exists idx_gym_products_display_order on gym_products(display_order);

-- Add RLS policies (copying pattern from gym_price_plans)
alter table gym_products enable row level security;

create policy "Users can view products for their gym"
  on gym_products for select
  using (
    exists (
      select 1 from gyms
      where gyms.id = gym_products.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

create policy "Users can insert products for their gym"
  on gym_products for insert
  with check (
    exists (
      select 1 from gyms
      where gyms.id = gym_products.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

create policy "Users can update products for their gym"
  on gym_products for update
  using (
    exists (
      select 1 from gyms
      where gyms.id = gym_products.gym_id
      and gyms.owner_id = auth.uid()
    )
  );

create policy "Users can delete products for their gym"
  on gym_products for delete
  using (
    exists (
      select 1 from gyms
      where gyms.id = gym_products.gym_id
      and gyms.owner_id = auth.uid()
    )
  );
