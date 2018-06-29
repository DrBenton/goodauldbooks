import { container } from "../ServicesContainer";

const appStateStore = container.appStateStore;

// @see Main.tsx for the definitions of those routes

export function getBookPageUrl(
  bookLang: string,
  authorSlug: string,
  bookSlug: string,
  bookId: string
) {
  return `/library/${
    appStateStore.getState().booksLang
  }/book/${bookLang}/${authorSlug}/${bookSlug}/${bookId}`;
}

export function getAuthorPageUrl(
  authorSlug: string,
  authorId: string,
  pageNumber: null | number = null
) {
  return `/library/${appStateStore.getState().booksLang}/author/${authorSlug}/${authorId}${
    pageNumber ? `&page=${pageNumber}` : ""
  }`;
}

export function getGenrePageUrl(genre: string, pageNumber: null | number = null) {
  return `/library/${appStateStore.getState().booksLang}/genre/${genre}${
    pageNumber ? `&page=${pageNumber}` : ""
  }`;
}
