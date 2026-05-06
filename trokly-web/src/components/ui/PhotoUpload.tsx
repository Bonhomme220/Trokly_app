"use client";

import { useRef, useState } from "react";
import api from "@/lib/api";
import { Camera, X } from "lucide-react";

interface PhotoSlotProps {
  url: string;
  index: number;
  onUploaded: (url: string) => void;
  onRemove: () => void;
}

function PhotoSlot({ url, index, onUploaded, onRemove }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data.url);
    } catch {
      setError("Erreur upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (url) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EDE8" }}>
        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(11,26,43,0.7)", color: "white" }}
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <label
      className="relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
      style={{ borderColor: error ? "#CC0000" : "rgba(11,26,43,0.15)", background: "#FAFAFA" }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      {uploading ? (
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00D084", borderTopColor: "transparent" }} />
      ) : (
        <>
          <Camera size={18} style={{ color: "#8A99AA" }} />
          <span className="text-xs mt-1" style={{ color: "#8A99AA" }}>Photo {index + 1}</span>
        </>
      )}
      {error && <span className="text-xs absolute bottom-1" style={{ color: "#CC0000" }}>{error}</span>}
    </label>
  );
}

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  min?: number;
  max?: number;
}

export default function PhotoUpload({ photos, onChange, min = 6, max = 10 }: PhotoUploadProps) {
  const slots = Math.max(photos.length + 1, min);
  const cappedSlots = Math.min(slots, max);

  function handleUploaded(index: number, url: string) {
    const next = [...photos];
    next[index] = url;
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: cappedSlots }).map((_, i) => (
          <PhotoSlot
            key={i}
            index={i}
            url={photos[i] ?? ""}
            onUploaded={(url) => handleUploaded(i, url)}
            onRemove={() => handleRemove(i)}
          />
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: "#8A99AA" }}>
        {photos.length}/{min} photos minimum · Max {max}
      </p>
    </div>
  );
}
