import * as React from "react";
import { Option } from "react-select";
import { AsyncOptionsResult, AutocompleteSearch } from "../components/AutocompleteSearch";
import { BooksLangContext } from "../contexts/books-lang";
import { Lang } from "../domain/core";
import { ACTIONS, GoToAuthorPageAction, GoToBookPageAction } from "../domain/messages";
import { QuickSearchResult } from "../domain/queries";
import { OmniponentComponentToolbox } from "./OmnipotentComponentToolbox";

export interface AutocompleteSearchContainerProps {
  hocToolbox: OmniponentComponentToolbox;
}

export class AutocompleteSearchContainer extends React.Component<AutocompleteSearchContainerProps> {
  constructor(props: AutocompleteSearchContainerProps) {
    super(props);
    this.searchFunction = this.searchFunction.bind(this);
    this.redirectToSelectedSearchResultPage = this.redirectToSelectedSearchResultPage.bind(this);
  }

  public render() {
    return (
      <BooksLangContext.Consumer>
        {(currentBooksLang: Lang) => (
          <AutocompleteSearch
            searchFunction={this.searchFunction}
            booksLang={currentBooksLang}
            redirectToSelectedSearchResultPageFunction={this.redirectToSelectedSearchResultPage}
          />
        )}
      </BooksLangContext.Consumer>
    );
  }

  private async searchFunction(input: string, booksLang: Lang): Promise<AsyncOptionsResult> {
    if (input.length < 2) {
      return Promise.resolve({ options: [] });
    }

    const booksRepository = this.props.hocToolbox.servicesLocator.booksRepository;
    const results = await booksRepository.quickSearch(input, booksLang);
    if (!results.length) {
      return { options: [], complete: true };
    }

    const options = results.map(
      (match: QuickSearchResult): Option => {
        // @see AutocompleteSearch component for the reason of these pretty ugly poor man serialisation
        return {
          value: JSON.stringify(match),
          label: "", // all we need to build the label is contained in the serialised value
        };
      }
    );

    return { options };
  }

  private redirectToSelectedSearchResultPage(selectedResult: QuickSearchResult): void {
    const author = selectedResult.author;

    if (selectedResult.book) {
      const book = selectedResult.book;
      const goToBookPageActionPayload: GoToBookPageAction = {
        bookId: book.id,
        bookSlug: book.slug,
        bookLang: book.lang,
        authorSlug: author.slug,
      };
      this.props.hocToolbox.messageBus.emit(ACTIONS.GO_TO_BOOK_PAGE, goToBookPageActionPayload);
      return;
    }

    if (author) {
      const goToAuthorPageActionPayload: GoToAuthorPageAction = {
        authorId: author.id,
        authorSlug: author.slug,
      };
      this.props.hocToolbox.messageBus.emit(ACTIONS.GO_TO_AUTHOR_PAGE, goToAuthorPageActionPayload);
      return;
    }
  }
}
