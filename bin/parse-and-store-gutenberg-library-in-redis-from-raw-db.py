import sys

if __name__ == "__main__":
    import json

    import sqlite3
    import time
    import typing as t

    from walrus import Database

    from _import_common import init_path, init_import_logging

    init_path()

    from infra.redis import redis_host, redis_client
    from library_import import pg_import
    from library_import.domain import Book, Author
    from library.utils import get_genre_hash

    sqlite_db_path_str = sys.argv[1]
    db_con = sqlite3.connect(sqlite_db_path_str)

    nb_books_in_db = db_con.execute("select count(*) from raw_book").fetchone()[0]
    if nb_books_in_db == 0:
        print("No books round in 'raw_book' SQLite table. Exiting.")
        sys.exit(1)

    autocomplete_db = Database(redis_host).autocomplete()

    start_time = time.monotonic()
    nb_books_parsed = 0

    print(
        f"Starting parsing and storage (in Redis) of {nb_books_in_db} books from the SQLite database."
    )

    def _on_book_parsed(book: Book, author: t.Optional[Author]):
        global nb_books_parsed

        book_id = f"book:pg:{book.gutenberg_id}"
        book_dict = book._asdict()

        if book_dict["genres"]:
            genres_hashes_mapping = {get_genre_hash(g): g for g in book_dict["genres"]}

            # save "genres:hashes_mapping" keys for this book
            redis_client.hmset("genres:hashes_mapping", genres_hashes_mapping)
            # save "genres:hashes_mapping_reversed" keys for this book
            genres_hashes_mapping_reversed = {
                title: hash for hash, title in genres_hashes_mapping.items()
            }
            redis_client.hmset(
                "genres:hashes_mapping_reversed", genres_hashes_mapping_reversed
            )

            # save "genres:stats:books_by_lang:[genre_hash]" keys for this book
            for genre_hash in genres_hashes_mapping:
                redis_client.hincrby(
                    f"genres:stats:books_by_lang:{genre_hash}", "__all__", 1
                )
                redis_client.hincrby(
                    f"genres:stats:books_by_lang:{genre_hash}", book_dict["lang"], 1
                )

            book_dict["genres"] = list(genres_hashes_mapping.keys())

        book_dict["assets"] = {
            asset_type.type.name: asset_type.size for asset_type in book_dict["assets"]
        }

        if book.title:
            autocomplete_db.store(
                obj_type="book", obj_id=book_id, title=book.title, data=book_id
            )

        if author and author.name:
            author_id = f"author:pg:{author.gutenberg_id}"
            book_dict["author_ids"] = [author_id]
            autocomplete_db.store(
                obj_type="author", obj_id=author_id, title=author.name, data=author_id
            )

        # save "book:pg:[id]"
        redis_client.set(book_id, json.dumps(book_dict))

        if author:
            author_dict = author._asdict()
            # save "author:pg:[id]"
            redis_client.set(author_id, json.dumps(author_dict))

        nb_books_parsed += 1

        if nb_books_parsed % 100 == 0:
            percent = round(nb_books_parsed * 100 / nb_books_in_db)
            duration = round(time.monotonic() - start_time, 1)
            print(
                f"{str(percent).rjust(3)}% - {nb_books_parsed} books parsed ({duration}s)...",
                end="\r",
                flush=True,
            )

    init_import_logging()

    nb_pg_rdf_files_found = pg_import.parse_books_from_raw_db(db_con, _on_book_parsed)

    duration = round(time.monotonic() - start_time, 1)
    print(
        f"\n{nb_pg_rdf_files_found} books parsed from raw data in DB, and injected into Redis, in {duration}s."
    )

    print(list(autocomplete_db.search("well")))
