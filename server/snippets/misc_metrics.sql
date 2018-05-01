-- Author with multiple books:
WITH author_with_nb_books AS (
    SELECT
        (author.first_name || '' || author.last_name) AS author_name,
        COUNT(author_books.author_id) AS nb_books
    FROM
        author
    LEFT JOIN
        author_books ON author.id = author_books.author_id
    GROUP BY
        author_name
)
SELECT
    author_name,
    nb_books
FROM
    author_with_nb_books
WHERE
    nb_books > 1
ORDER BY
    nb_books DESC
;