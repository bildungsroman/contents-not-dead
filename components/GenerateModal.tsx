"use client";

import { useState } from "react";
import { addSessionPost } from "@/lib/session-posts";
import { GEN_LIMIT } from "@/lib/gen-constants";
import { Button } from "./Button";
import { Field } from "./Field";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

export function GenerateModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [type, setType] = useState<"article" | "image">("article");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      // Server faults can return an empty body, so parsing is allowed to fail
      // without being reported as a network error.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.post) {
        setError(
          data?.error || `Generation failed (${res.status}). Please try again.`,
        );
        if (typeof data?.remaining === "number") setRemaining(data.remaining);
        setLoading(false);
        return;
      }
      addSessionPost(data.post);
      onGenerated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const lowRemaining =
    remaining !== null && remaining <= 1 && remaining > 0;

  return (
    <Modal label="Generate content" onClose={onClose}>
      {loading ? (
        <div
          className="center"
          style={{ flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <Spinner size="large" label="Generating content" />
          <p>Generating… this can take a few seconds.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <h2 style={{ marginTop: 0 }}>Generate content</h2>
          <p className="meta">
            Up to {GEN_LIMIT} generations per session. Content is ephemeral and
            disappears on reload.
          </p>
          {error ? <p className="warn">{error}</p> : null}
          {lowRemaining ? (
            <p className="warn">
              Heads up: only {remaining} generation left this session.
            </p>
          ) : null}
          <Field id="gen-type" label="Type">
            <select
              id="gen-type"
              value={type}
              onChange={(e) => setType(e.target.value as "article" | "image")}
            >
              <option value="article">Article</option>
              <option value="image">Image</option>
            </select>
          </Field>
          <Field id="gen-tags" label="Tags (comma-separated)">
            <input
              id="gen-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="space, optimism"
              required
            />
          </Field>
          <Field
            id="gen-desc"
            label={`What would you like to ${type === "image" ? "see" : "read"}?`}
          >
            <textarea
              id="gen-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A hopeful short essay about small daily wins"
              maxLength={280}
              required
            />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Generate</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
