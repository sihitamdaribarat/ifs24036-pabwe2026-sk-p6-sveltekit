import { get, writable } from "svelte/store";
import userApi, { type User } from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface UsersState {
  users: User[];
  user: User | null;
  profile: User | null;
  isProfile: boolean;
  isChangeProfile: boolean;
  isChangeProfilePhoto: boolean;
  isChangeProfilePassword: boolean;
}

function createUsersStore() {
  const initial: UsersState = {
    users: [],
    user: null,
    profile: null,
    isProfile: false,
    isChangeProfile: false,
    isChangeProfilePhoto: false,
    isChangeProfilePassword: false,
  };

  const innerStore = writable<UsersState>({ ...initial });

  function patch(partial: Partial<UsersState>) {
    innerStore.update((s) => ({ ...s, ...partial }));
  }

  const setUsers = (users: User[]) => patch({ users });
  const setUser = (user: User | null) => patch({ user });
  const setProfile = (profile: User | null) => patch({ profile });
  const setIsProfile = (status: boolean) => patch({ isProfile: status });
  const setIsChangeProfile = (status: boolean) => patch({ isChangeProfile: status });
  const setIsChangeProfilePhoto = (status: boolean) => patch({ isChangeProfilePhoto: status });
  const setIsChangeProfilePassword = (status: boolean) =>
    patch({ isChangeProfilePassword: status });

  async function asyncSetUsers(): Promise<void> {
    try {
      setUsers(await userApi.getUsers());
    } catch {
      setUsers([]);
    }
  }

  async function asyncSetUserById(userId: number | string): Promise<void> {
    try {
      setUser(await userApi.getUserById(userId));
    } catch {
      setUser(null);
    }
  }

  async function asyncSetProfile(): Promise<User | null> {
    try {
      const profile = await userApi.getProfile();
      setProfile(profile);
      return profile;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setIsProfile(true);
    }
  }

  async function asyncPutProfile(name: string, email: string): Promise<boolean> {
    setIsChangeProfile(true);
    try {
      setProfile(await userApi.putProfile(name, email));
      showSuccessDialog("Profil berhasil diperbarui!");
      return true;
    } catch (error) {
      showErrorDialog((error as Error).message);
      return false;
    } finally {
      setIsChangeProfile(false);
    }
  }

  async function asyncPostProfilePhoto(photo: File): Promise<boolean> {
    setIsChangeProfilePhoto(true);
    try {
      const message = await userApi.postProfilePhoto(photo);
      showSuccessDialog(message || "Foto profil berhasil diperbarui!");
      setProfile(await userApi.getProfile());
      return true;
    } catch (error) {
      showErrorDialog((error as Error).message);
      return false;
    } finally {
      setIsChangeProfilePhoto(false);
    }
  }

  async function asyncPutProfilePassword(
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<boolean> {
    setIsChangeProfilePassword(true);
    try {
      const message = await userApi.putProfilePassword(
        oldPassword,
        newPassword,
        newPasswordConfirmation
      );
      showSuccessDialog(message || "Kata sandi berhasil diperbarui!");
      return true;
    } catch (error) {
      showErrorDialog((error as Error).message);
      return false;
    } finally {
      setIsChangeProfilePassword(false);
    }
  }

  return {
    subscribe: innerStore.subscribe,
    get $state(): UsersState {
      return get(innerStore);
    },
    reset(state: Partial<UsersState> = {}) {
      innerStore.set({ ...initial, ...state });
    },
    setUsers,
    setUser,
    setProfile,
    setIsProfile,
    setIsChangeProfile,
    setIsChangeProfilePhoto,
    setIsChangeProfilePassword,
    asyncSetUsers,
    asyncSetUserById,
    asyncSetProfile,
    asyncPutProfile,
    asyncPostProfilePhoto,
    asyncPutProfilePassword,
  };
}

export const usersStore = createUsersStore();
export default usersStore;
