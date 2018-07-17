import * as EventEmitter from "eventemitter3";
import { createBrowserHistory, History } from "history";
import { i18n as i18next } from "i18next";
import { Store } from "redux";
import { ActionsDispatcherImpl } from "./ActionsDispatcher";
import { initI18n } from "./boot/i18n-init";
import { ActionsDispatcher } from "./domain/app-state";
import { BooksLanguagesRepository, BooksRepository } from "./domain/queries";
import { ServicesLocator } from "./domain/services";
import { BooksLanguagesGeneratedJsonRepository } from "./repositories/BooksLanguagesGeneratedJsonRepository";
import { BooksWithAppStateCacheRepository } from "./repositories/BooksWithAppStateCacheRepository";
import { AppState } from "./store";
import { initStore } from "./store-init";
import { BooksGraphqlRepository } from "./repositories/BooksGraphqlRepository";

enum SharedServicesIds {
  APP_STATE_STORE,
  BOOKS_HTTP_REPOSITORY,
  BOOKS_APP_STATE_CACHE_REPOSITORY,
  BOOKS_LANGS_JSON_REPOSITORY,
  I18N,
  MESSAGE_BUS,
  HISTORY,
  ACTIONS_DISPATCHER,
}

type SharedServicesRegistry = Map<SharedServicesIds, any>;

const sharedServicesRegistry: SharedServicesRegistry = new Map();

function sharedService(serviceId: SharedServicesIds, serviceFactory: () => any) {
  if (sharedServicesRegistry.has(serviceId)) {
    return sharedServicesRegistry.get(serviceId);
  }
  const serviceSharedInstance: any = serviceFactory();
  sharedServicesRegistry.set(serviceId, serviceSharedInstance);
  return serviceSharedInstance;
}

export class ServicesLocatorImpl implements ServicesLocator {
  private booted: boolean = false;

  public async boot(): Promise<boolean> {
    if (this.booted) {
      return false;
    }

    // Let's boot our async services!
    await this.bootAsyncServices();

    this.booted = true;
    return true;
  }

  get appStateStore(): Store<AppState> {
    return sharedService(SharedServicesIds.APP_STATE_STORE, () => {
      return initStore(this);
    });
  }

  get booksRepository(): BooksRepository {
    return sharedService(SharedServicesIds.BOOKS_APP_STATE_CACHE_REPOSITORY, () => {
      const booksGraphqlRepository = this.booksGraphqlRepository;
      const bookWithCacheRepository = new BooksWithAppStateCacheRepository(
        this.appStateStore,
        booksGraphqlRepository
      );

      return bookWithCacheRepository;
    });
  }

  get booksLangsRepository(): BooksLanguagesRepository {
    return sharedService(SharedServicesIds.BOOKS_LANGS_JSON_REPOSITORY, () => {
      const booksLangsGenereatedJsonRepository = new BooksLanguagesGeneratedJsonRepository();

      return booksLangsGenereatedJsonRepository;
    });
  }

  get i18n(): i18next {
    if (!sharedServicesRegistry.has(SharedServicesIds.I18N)) {
      this.throwNotBootedError("i18n");
    }
    return sharedServicesRegistry.get(SharedServicesIds.I18N);
  }

  get messageBus(): EventEmitter {
    return sharedService(SharedServicesIds.MESSAGE_BUS, () => {
      const eventEmitter = new EventEmitter();

      return eventEmitter;
    });
  }

  get history(): History {
    return sharedService(SharedServicesIds.HISTORY, () => {
      const history = createBrowserHistory();

      return history;
    });
  }

  get actionsDispatcher(): ActionsDispatcher {
    return sharedService(SharedServicesIds.ACTIONS_DISPATCHER, () => {
      const actionsDispatcher = new ActionsDispatcherImpl(
        this.booksRepository,
        this.messageBus,
        this.appStateStore
      );

      return actionsDispatcher;
    });
  }

  private get booksGraphqlRepository(): BooksGraphqlRepository {
    return sharedService(SharedServicesIds.BOOKS_HTTP_REPOSITORY, () => {
      const booksGraphqlRepository = new BooksGraphqlRepository();

      return booksGraphqlRepository;
    });
  }

  private async bootAsyncServices() {
    // i18n
    const i18n = await initI18n(this);
    sharedServicesRegistry.set(SharedServicesIds.I18N, i18n);
  }

  private throwNotBootedError(serviceName: string) {
    throw new Error(
      `Service ${serviceName} requires a preliminary call to "ServiceContainer.boot()" method!`
    );
  }
}
