import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useArenaStats() {
  return useQuery({ ...orpc.arena.stats.queryOptions(), refetchInterval: 15_000 });
}

export function useCategories() {
  return useQuery(orpc.arena.categories.queryOptions());
}

export function useTopics(q: string, category: string) {
  return useQuery(orpc.arena.topics.queryOptions({ input: { q, category } }));
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    ...orpc.arena.createTopic.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: orpc.arena.key() }),
  });
}

export function useRandomTopic() {
  return useMutation(orpc.arena.randomTopic.mutationOptions());
}
