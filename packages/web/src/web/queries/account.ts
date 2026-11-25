import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { session } from "../lib/session";

/** Current user, or null when signed out. Never retries: UNAUTHORIZED is the normal logged-out state. */
export function useMe() {
  const hasToken = !!session.get();
  const q = useQuery({ ...orpc.account.me.queryOptions(), enabled: hasToken, retry: false });
  return {
    user: hasToken && q.data ? q.data : null,
    loading: hasToken && q.isLoading,
  };
}

export function useAuthMutations() {
  const qc = useQueryClient();
  const onAuth = (token: string) => {
    session.set(token);
    qc.invalidateQueries({ queryKey: orpc.account.key() });
    qc.invalidateQueries({ queryKey: orpc.debates.key() });
  };

  const register = useMutation({
    ...orpc.account.register.mutationOptions(),
    onSuccess: (r) => onAuth(r.token),
  });
  const login = useMutation({
    ...orpc.account.login.mutationOptions(),
    onSuccess: (r) => onAuth(r.token),
  });
  const logout = useMutation({
    ...orpc.account.logout.mutationOptions(),
    onSettled: () => {
      session.clear();
      qc.invalidateQueries({ queryKey: orpc.account.key() });
      qc.invalidateQueries({ queryKey: orpc.debates.key() });
    },
  });
  const updateProfile = useMutation({
    ...orpc.account.updateProfile.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.account.key() });
      qc.invalidateQueries({ queryKey: orpc.league.key() });
    },
  });
  const deleteProfile = useMutation({
    ...orpc.account.deleteProfile.mutationOptions(),
    onSuccess: () => {
      session.clear();
      qc.clear();
    },
  });
  return { register, login, logout, updateProfile, deleteProfile };
}
