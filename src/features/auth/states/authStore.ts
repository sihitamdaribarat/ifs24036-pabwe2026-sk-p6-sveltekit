import { get, writable } from "svelte/store";
import authApi from "../api/authApi";
import apiHelper from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface AuthState {
  isAuthLogin: boolean;
  isAuthRegister: boolean;
  isAuthLogout: boolean;
}

function createAuthStore() {
  const initial: AuthState = {
    isAuthLogin: false,
    isAuthRegister: false,
    isAuthLogout: false,
  };

  const innerStore = writable<AuthState>({ ...initial });

  function setIsAuthLogin(value: boolean) {
    innerStore.update((s) => ({ ...s, isAuthLogin: value }));
  }

  function setIsAuthRegister(value: boolean) {
    innerStore.update((s) => ({ ...s, isAuthRegister: value }));
  }

  function setIsAuthLogout(value: boolean) {
    innerStore.update((s) => ({ ...s, isAuthLogout: value }));
  }

  async function asyncSetIsAuthLogin(email: string, password: string): Promise<boolean> {
    try {
      const data = await authApi.postLogin(email, password);
      apiHelper.putAccessToken(data.token);
      setIsAuthLogin(true);
      return true;
    } catch (error) {
      setIsAuthLogin(false);
      showErrorDialog((error as Error).message);
      return false;
    }
  }

  async function asyncSetIsAuthRegister(
    name: string,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const message = await authApi.postRegister(name, email, password);
      setIsAuthRegister(true);
      showSuccessDialog(message);
      return true;
    } catch (error) {
      setIsAuthRegister(false);
      showErrorDialog((error as Error).message);
      return false;
    }
  }

  async function asyncSetIsAuthLogout(): Promise<void> {
    try {
      await authApi.postLogout();
    } catch {
      // Token lokal tetap dihapus walaupun server gagal merespons
    } finally {
      apiHelper.putAccessToken("");
      setIsAuthLogout(true);
    }
  }

  return {
    subscribe: innerStore.subscribe,
    get $state(): AuthState {
      return get(innerStore);
    },
    reset(state: Partial<AuthState> = {}) {
      innerStore.set({ ...initial, ...state });
    },
    setIsAuthLogin,
    setIsAuthRegister,
    setIsAuthLogout,
    asyncSetIsAuthLogin,
    asyncSetIsAuthRegister,
    asyncSetIsAuthLogout,
  };
}

export const authStore = createAuthStore();
export default authStore;
