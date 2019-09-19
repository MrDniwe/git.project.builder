alter table build add column version character varying(255) not null;
alter table build add column file_hash character varying(255);
alter table build add constraint uniq_file_hash_and_version_combination unique(version, file_hash);
create type inner_state as enum ('waiting', 'in_progress', 'done', 'error');
alter table build add column inner_state inner_state not null default 'waiting';