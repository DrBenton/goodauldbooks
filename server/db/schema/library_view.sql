begin;

drop schema if exists library_view cascade;
create schema library_view;

create schema if not exists exts;
create extension if not exists pg_trgm schema exts;

-- This materialized view is what powers our public API :-)
create materialized view library_view.book_with_related_data as
  select
    (case
     when book.gutenberg_id is not null then concat('g', book.gutenberg_id)
     else book.book_id::text
     end) as id,
    book.title as title,
    book.subtitle as subtitle,
    book.lang as lang,
    substring(utils.slugify(book.title) for 50) as slug,
    book_cover.path as cover,
    author.author_id::text as author_id,
    author.first_name as author_first_name,
    author.last_name as author_last_name,
    substring(utils.slugify(author.first_name || ' ' || author.last_name) for 50) as author_slug,
    (select count(*) from library.book as book2 where book2.author_id = author.author_id)::integer as author_nb_books,
    array_agg(genre.genre_id) as genres_ids,
    array_agg(genre.title) as genres
  from
    library.book
    join
    library.author using (author_id)
    left join
    library.book_genre using (book_id)
    left join
    library.genre using (genre_id)
    left join
    library.book_asset as book_cover
      on (book.book_id = book_cover.book_id and book_cover.type = 'cover')
  group by
    book.book_id,
    author.author_id,
    book_cover.path
with no data;
create unique index on library_view.book_with_related_data
  (id collate "C");
create index on library_view.book_with_related_data
  (author_id collate "C");
create index on library_view.book_with_related_data
  (lang collate "C");
create index on library_view.book_with_related_data
  using gin(title exts.gin_trgm_ops);
create index on library_view.book_with_related_data
  using gin(author_last_name exts.gin_trgm_ops);

-- This materialized view has only 4 fields,
-- but the "nb_book_per_lang" is quite expensive to compute.
create materialized view library_view.genre_with_related_data as (
  with
  lang as (
    select
      distinct(lang) as lang
    from
      library.book
  )
  select
    genre_id,
    title,
    count(nb_books_by_lang.lang) as nb_langs,
    sum(nb_books_by_lang.nb_books) as nb_books,
    json_object(
      array_agg(nb_books_by_lang.lang),
      array_agg(nb_books_by_lang.nb_books::text)
    ) as nb_books_by_lang
  from
    library.genre
    left join lateral (
      select
        lang.lang,
        count(book.book_id)::integer
      from
        lang
        join library.book as book on lang.lang = book.lang
        join library.book_genre using (book_id)
      where
        library.book_genre.genre_id = genre.genre_id
      group by
        lang.lang
      order by
        lang.lang asc
    ) nb_books_by_lang(lang, nb_books) on true
  group by
    genre_id
)
with no data;
create unique index on library_view.genre_with_related_data
  (title collate "C");

commit;