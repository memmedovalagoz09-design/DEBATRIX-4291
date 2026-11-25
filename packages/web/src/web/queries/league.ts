import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useLeague() {
  return useQuery({ ...orpc.league.standings.queryOptions(), refetchInterval: 20_000 });
}
