import * as React from "react";
import { RouteComponentProps } from "react-router";
import { Head } from "../components/Layout/Head";
import { HigherOrderComponentToolkitContext } from "../contexts/hoc-toolkit";
import { BookFullContainer } from "../hoc/Book/BookFullContainer";
import { HigherOrderComponentToolkit } from "../hoc/HigherOrderComponentToolkit";

export function BookPage(routeProps: RouteComponentProps<{ bookId: string }>): JSX.Element {
  return (
    <>
      <Head isLandingPage={false} pageName={"book"} />
      <section>
        <HigherOrderComponentToolkitContext.Consumer>
          {(hocToolkit: HigherOrderComponentToolkit) => (
            <BookFullContainer bookId={routeProps.match.params.bookId} hocToolkit={hocToolkit} />
          )}
        </HigherOrderComponentToolkitContext.Consumer>
      </section>
    </>
  );
}
