
drop schema if exists utils cascade;
create schema utils;

create schema if not exists exts;

create extension if not exists unaccent schema exts;

create or replace function utils.slugify(
  base_string text
) returns text
language sql
as $function_slugify$
-- @link http://schinckel.net/2015/12/16/slugify%28%29-for-postgres-%28almost%29/ :-)
with
  normalized as (
    select exts.unaccent('exts.unaccent', base_string) as value
  ),
  remove_chars as (
    select regexp_replace(value, e'[^\\w\\s-]', '', 'gi') as value
    from normalized
  ),
  lowercase as (
    select lower(value) as value
    from remove_chars
  ),
  trimmed as (
    select trim(value) as value
    from lowercase
  ),
  hyphenated as (
    select regexp_replace(value, e'[-\\s]+', '-', 'gi') as value
    from trimmed
  )
select value from hyphenated;
$function_slugify$;