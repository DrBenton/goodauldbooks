import { AssetsConfig } from "domain/web";
import * as React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider as ReduxStoreProvider } from "react-redux";
import { Router } from "react-router-dom";
import { AppConfig } from "../app-config";
import { AssetsConfigContext } from "../contexts/assets-config";
import { BooksLangContext } from "../contexts/books-lang";
import { MessageBusContext } from "../contexts/message-bus";
import { container, ServicesContainer } from "../ServicesContainer";

interface AppEnvelopeState {
  booksLang: string;
  assetsConfig: AssetsConfig;
}

/**
 * This is where we initialise all our global React Context Providers
 */
export class AppEnvelope extends React.Component<{}, AppEnvelopeState> {
  private servicesContainer: ServicesContainer;

  constructor(props: {}) {
    super(props);
    this.state = {
      booksLang: container.appStateStore.getState().booksLang,
      assetsConfig: { coversBaseUrl: AppConfig.coversBaseURL },
    };
    this.servicesContainer = container;
    this.servicesContainer.appStateStore.subscribe(this.onAppStateUpdate.bind(this));
  }

  public render() {
    console.log("AppEnvelope::render()");
    return (
      <ReduxStoreProvider store={container.appStateStore}>
        <MessageBusContext.Provider value={container.messageBus}>
          <BooksLangContext.Provider value={this.state.booksLang}>
            <I18nextProvider i18n={container.i18n}>
              <AssetsConfigContext.Provider value={this.state.assetsConfig}>
                <Router history={container.history}>
                  <>
                    {/* And here comes our app !*/}
                    {this.props.children}
                  </>
                </Router>
              </AssetsConfigContext.Provider>
            </I18nextProvider>
          </BooksLangContext.Provider>
        </MessageBusContext.Provider>
      </ReduxStoreProvider>
    );
  }

  private onAppStateUpdate() {
    const appReduxState = this.servicesContainer.appStateStore.getState();
    const newBooksLang = appReduxState.booksLang;
    if (newBooksLang !== this.state.booksLang) {
      console.log("newBooksLang=", newBooksLang);
      this.setState({
        booksLang: newBooksLang,
      });
    }
  }
}
