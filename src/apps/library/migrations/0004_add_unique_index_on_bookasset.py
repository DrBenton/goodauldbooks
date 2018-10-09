# Generated by Django 2.1.1 on 2018-10-09 21:19

# pylint: skip-file

from django.db import migrations

FORWARD_SQL = """\
create unique index library_book_asset_uniq_idx on library_book_asset(book_id, type);
"""

REVERSE_SQL = """\
drop index if exists library_book_asset_uniq_idx;
"""


class Migration(migrations.Migration):
    dependencies = [("library", "0003_bookasset")]

    operations = [migrations.RunSQL(FORWARD_SQL, reverse_sql=REVERSE_SQL)]
