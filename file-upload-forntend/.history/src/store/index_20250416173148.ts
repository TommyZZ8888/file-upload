import { createStore } from "vuex";
import type { InjectionKey } from "vue";
import type { Store } from "vuex";

export interface State {
  // 定义你的状态类型
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {},
});

export function useStore() {
  return store as Store<State>;
}

export default store;
