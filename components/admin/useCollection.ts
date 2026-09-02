"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";

/**
 * Loads a collection from /api/<resource> and writes every change back
 * through it, so the public website reflects the edit on its next load.
 */
export function useCollection<T extends { id: string }>(resource: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const url = `/api/${resource}`;

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await api.get<T[]>(url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this list.");
    }
  }, [url]);

  useEffect(() => { load(); }, [load]);

  /** Runs a write, keeps local state in step, and surfaces the API error. */
  const run = useCallback(async (write: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await write();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that change.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const create = useCallback(
    (values: Record<string, unknown>) =>
      run(async () => {
        const created = await api.post<T>(url, values);
        setItems((cur) => [created, ...(cur ?? [])]);
      }),
    [run, url]
  );

  const update = useCallback(
    (id: string, values: Record<string, unknown>) =>
      run(async () => {
        const updated = await api.patch<T>(`${url}/${id}`, values);
        setItems((cur) => (cur ?? []).map((i) => (i.id === id ? updated : i)));
      }),
    [run, url]
  );

  const remove = useCallback(
    (id: string) =>
      run(async () => {
        await api.del(`${url}/${id}`);
        setItems((cur) => (cur ?? []).filter((i) => i.id !== id));
      }),
    [run, url]
  );

  return { items, loading: items === null && !error, error, saving, create, update, remove, reload: load };
}
