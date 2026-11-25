import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useDebateList(status: "live" | "waiting" | "completed") {
  return useQuery({
    ...orpc.debates.list.queryOptions({ input: { status } }),
    refetchInterval: status === "live" ? 4000 : 20_000,
  });
}

/** Full debate view. Polls while the debate is open so AI turns and timers move on their own. */
export function useDebate(id: string) {
  return useQuery({
    ...orpc.debates.get.queryOptions({ input: { id } }),
    refetchInterval: (q) => (q.state.data?.status === "completed" ? false : 2500),
    retry: false,
  });
}

export function useMyInvites(enabled: boolean) {
  return useQuery({ ...orpc.debates.myInvites.queryOptions(), enabled, retry: false, refetchInterval: 15_000 });
}

export function useMyDebates(enabled: boolean) {
  return useQuery({ ...orpc.debates.mine.queryOptions(), enabled, retry: false });
}

export function useDebateMutations() {
  const qc = useQueryClient();
  const invalidateAll = () => qc.invalidateQueries({ queryKey: orpc.debates.key() });
  const invalidateArena = () => qc.invalidateQueries({ queryKey: orpc.arena.key() });

  const create = useMutation({
    ...orpc.debates.create.mutationOptions(),
    onSuccess: () => {
      invalidateAll();
      invalidateArena();
    },
  });
  const join = useMutation({ ...orpc.debates.join.mutationOptions(), onSuccess: invalidateAll });
  const submit = useMutation({ ...orpc.debates.submit.mutationOptions(), onSuccess: invalidateAll });
  const vote = useMutation({ ...orpc.debates.vote.mutationOptions(), onSuccess: invalidateAll });
  const react = useMutation({ ...orpc.debates.react.mutationOptions(), onSuccess: invalidateAll });
  const comment = useMutation({ ...orpc.debates.comment.mutationOptions(), onSuccess: invalidateAll });
  const question = useMutation({ ...orpc.debates.question.mutationOptions(), onSuccess: invalidateAll });
  const upvote = useMutation({ ...orpc.debates.upvoteQuestion.mutationOptions(), onSuccess: invalidateAll });
  const rematch = useMutation({
    ...orpc.debates.rematch.mutationOptions(),
    onSuccess: invalidateAll,
  });
  const translate = useMutation(orpc.debates.translate.mutationOptions());
  return { create, join, submit, vote, react, comment, question, upvote, rematch, translate };
}
