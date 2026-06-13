-- Step 3: 인덱스 및 Row Level Security

-- 인덱스 생성
create index if not exists idx_users_facility_id on public.users(facility_id);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_facilities_director_id on public.facilities(director_id);
create index if not exists idx_employees_facility_id on public.employees(facility_id);
create index if not exists idx_employees_user_id on public.employees(user_id);
create index if not exists idx_annual_leave_balance_employee_id on public.annual_leave_balance(employee_id);
create index if not exists idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index if not exists idx_leave_requests_facility_id on public.leave_requests(facility_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);

-- Row Level Security 활성화
alter table public.users enable row level security;
alter table public.facilities enable row level security;
alter table public.employees enable row level security;
alter table public.annual_leave_balance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_standards enable row level security;
alter table public.facility_settings enable row level security;

-- RLS 정책

-- Users 정책
drop policy if exists "Users can view their own data" on public.users;
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Directors can view facility staff" on public.users;
create policy "Directors can view facility staff" on public.users
  for select using (
    exists(
      select 1 from public.facilities
      where facilities.director_id = auth.uid()
      and facilities.id = users.facility_id
    )
  );

-- Employees 정책
drop policy if exists "Users can view their facility employees" on public.employees;
create policy "Users can view their facility employees" on public.employees
  for select using (
    exists(
      select 1 from public.users
      where users.id = auth.uid()
      and users.facility_id = employees.facility_id
    )
  );

drop policy if exists "Employees can insert their own data" on public.employees;
create policy "Employees can insert their own data" on public.employees
  for insert with check (true);

drop policy if exists "Employees can update their own data" on public.employees;
create policy "Employees can update their own data" on public.employees
  for update using (
    exists(
      select 1 from public.users
      where users.id = auth.uid()
      and users.facility_id = employees.facility_id
    )
  );

drop policy if exists "Employees can delete their own data" on public.employees;
create policy "Employees can delete their own data" on public.employees
  for delete using (
    exists(
      select 1 from public.users
      where users.id = auth.uid()
      and users.facility_id = employees.facility_id
    )
  );

-- Leave Requests 정책
drop policy if exists "Users can view their own leave requests" on public.leave_requests;
create policy "Users can view their own leave requests" on public.leave_requests
  for select using (
    employee_id in (
      select id from public.employees
      where employees.user_id = auth.uid()
    )
  );

drop policy if exists "Directors can view facility leave requests" on public.leave_requests;
create policy "Directors can view facility leave requests" on public.leave_requests
  for select using (
    exists(
      select 1 from public.facilities
      where facilities.director_id = auth.uid()
      and facilities.id = leave_requests.facility_id
    )
  );

drop policy if exists "Employees can insert own leave requests" on public.leave_requests;
create policy "Employees can insert own leave requests" on public.leave_requests
  for insert with check (
    employee_id in (
      select id from public.employees
      where employees.user_id = auth.uid()
    )
  );

-- Facilities 정책
drop policy if exists "Directors can manage their facility" on public.facilities;
create policy "Directors can manage their facility" on public.facilities
  for all using (director_id = auth.uid());

drop policy if exists "Staff can view their facility" on public.facilities;
create policy "Staff can view their facility" on public.facilities
  for select using (
    id in (
      select facility_id from public.users
      where users.id = auth.uid()
    )
  );

-- Annual Leave Balance 정책
drop policy if exists "Employees can view their own balance" on public.annual_leave_balance;
create policy "Employees can view their own balance" on public.annual_leave_balance
  for select using (
    employee_id in (
      select id from public.employees
      where employees.user_id = auth.uid()
    )
  );

drop policy if exists "Directors can view facility balances" on public.annual_leave_balance;
create policy "Directors can view facility balances" on public.annual_leave_balance
  for select using (
    exists(
      select 1 from public.employees
      where employees.id = annual_leave_balance.employee_id
      and employees.facility_id in (
        select id from public.facilities
        where facilities.director_id = auth.uid()
      )
    )
  );

-- Leave Standards 정책
drop policy if exists "Users can view their facility standards" on public.leave_standards;
create policy "Users can view their facility standards" on public.leave_standards
  for select using (
    facility_id in (
      select facility_id from public.users
      where users.id = auth.uid()
    )
  );

-- Facility Settings 정책
drop policy if exists "Directors can manage facility settings" on public.facility_settings;
create policy "Directors can manage facility settings" on public.facility_settings
  for all using (
    facility_id in (
      select id from public.facilities
      where director_id = auth.uid()
    )
  );
