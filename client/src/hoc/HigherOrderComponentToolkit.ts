import * as EventEmitter from "eventemitter3";
import { Store } from "redux";
import { ActionsDispatcher } from "../domain/app-state";
import { AppState } from "../store";

export interface HigherOrderComponentToolkit {
  appStateStore: Store<AppState>;
  actionsDispatcher: ActionsDispatcher;
  messageBus: EventEmitter;
}
