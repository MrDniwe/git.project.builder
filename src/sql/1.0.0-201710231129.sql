create type platform as enum ('ios', 'android');
create type app_type as enum ('artist', 'gallery');
create table template (
  id serial primary key,
  repository character varying(255) not null,
  platform platform not null,
  app_type app_type not null,
  unique (platform, app_type)
);
create table application (
  id serial primary key,
  bundle_id character varying(255) not null,
  subject_id integer not null,
  template_id integer not null references template (id) on delete no action,
  platform platform not null,
  available_version_number character varying(255) not null,
  created_at timestamp without time zone default current_timestamp,
  updated_at timestamp without time zone default current_timestamp,
  constraint bundle_id_and_platform_combination unique (bundle_id, platform),
  constraint subject_id_and_template_id_combination unique (subject_id, template_id)
);
insert into template (repository, platform, app_type) values ('builder/test.ios', 'ios', 'artist');
insert into template (repository, platform, app_type) values ('builder/test.ios', 'ios', 'gallery');
insert into template (repository, platform, app_type) values ('builder/test.android', 'android', 'artist');
insert into template (repository, platform, app_type) values ('builder/test.android', 'android', 'gallery');
