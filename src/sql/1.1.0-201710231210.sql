create type build_status as enum ('running', 'pending', 'success', 'failed', 'canceled', 'skipped');
create table build (
  id serial primary key,
  application_id integer not null references application (id) on delete cascade,
  content_path character varying(255) not null,
  build_status build_status default null,
  commit character varying(255) default null,
  build_number integer default 0,
  created_at timestamp without time zone default current_timestamp,
  updated_at timestamp without time zone default current_timestamp
);