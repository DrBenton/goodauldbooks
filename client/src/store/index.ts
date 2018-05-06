import { Book, BooksById } from "../domain/core";

export interface AppState {
  booksById: BooksById;
  featuredBooksIds: string[];
}

export interface Action {
  type: string;
  payload: any;
}
