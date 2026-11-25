import * as React from "react";
import { useLocation } from "wouter";
import { Modal, Btn, Field, Input, Textarea, ErrorText } from "./ui-kit";
import { useCategories, useCreateTopic } from "../queries/arena";
import { useMe } from "../queries/account";
import { errorMessage } from "../lib/errors";

export function CreateTopicDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const { user } = useMe();
  const categories = useCategories();
  const createTopic = useCreateTopic();
  const cats = categories.data ?? [];
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");

  const selected = category || cats[0] || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onClose();
      setLocation("/giris");
      return;
    }
    setError("");
    try {
      await createTopic.mutateAsync({
        title,
        category: selected as (typeof cats)[number],
        description: description || undefined,
      });
      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni Mövzu Yarat">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Mövzu" hint="Debatın sualı. Məsələn: Süni intellekt insan əməyini əvəz etməlidirmi?">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mövzunu yazın"
            maxLength={200}
            required
          />
        </Field>
        <Field label="Kateqoriya">
          <select
            value={selected}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-pro focus:ring-2 focus:ring-blue-100"
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Qısa izah (istəyə görə)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Mövzunun kontekstini bir neçə cümlə ilə izah edin"
          />
        </Field>
        {!user && <p className="text-[14px] text-slate-500">Mövzu yaratmaq üçün əvvəlcə daxil olmalısan.</p>}
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Btn type="button" variant="outline" onClick={onClose}>
            Ləğv et
          </Btn>
          <Btn type="submit" disabled={createTopic.isPending || title.trim().length < 5}>
            {createTopic.isPending ? "Yaradılır..." : user ? "Mövzunu yarat" : "Daxil ol"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
