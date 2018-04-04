import * as React from "react";
import { CurrentLangContext } from "../contexts/lang";
import { Book, BooksById, Lang } from "../domain/core";
import { ListItem as BookListItem } from "./Book/ListItem";

export interface BooksListProps {
  books: BooksById;
}

export const BooksList = (props: BooksListProps) => {
  return (
    <CurrentLangContext.Consumer>
      {(currentLang: Lang) => (
        <div className="row books-list">
          <div className="card-deck">
            {Array.from(props.books.values()).map((book: Book) => {
              return (
                <BookListItem
                  book={book}
                  currentLang={currentLang}
                  key={book.id}
                />
              );
            })}
          </div>
        </div>
      )}
    </CurrentLangContext.Consumer>
  );
};
