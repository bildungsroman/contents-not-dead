"use client";

import { useState } from "react";
import { addSessionPost } from "@/lib/session-posts";
import { GEN_LIMIT } from "@/lib/gen-constants";

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed. Please try again.");
        if (typeof data.remaining === "number") setRemaining(data.remaining);
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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Generate content"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="center" style={{ flexDirection: "column", gap: 12 }}>
            <span className="spinner" />
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
            <div className="field">
              <label htmlFor="gen-type">Type</label>
              <select
                id="gen-type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "article" | "image")
                }
              >
                <option value="article">Article</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="gen-tags">Tags (comma-separated)</label>
              <input
                id="gen-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="space, optimism"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="gen-desc">
                What would you like to {type === "image" ? "see" : "read"}?
              </label>
              <textarea
                id="gen-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A hopeful short essay about small daily wins"
                maxLength={280}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn">
                Generate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
