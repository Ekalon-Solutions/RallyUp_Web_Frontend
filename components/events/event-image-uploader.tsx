'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches the backend multer cap

interface EventImageUploaderProps {
  /** Currently selected file (controlled). */
  value: File | null;
  onChange: (file: File | null) => void;
  /** Existing poster URL to preview when no new file is picked (edit mode). */
  existingImageUrl?: string | null;
  /** Primary text shown in the empty dropzone. */
  title?: string;
  /** Secondary hint shown in the empty dropzone. */
  hint?: string;
  disabled?: boolean;
}

/**
 * Controlled poster picker for the event wizard: click/drag an image, preview it,
 * remove it. Validates type + size client-side (backend re-validates and generates
 * the 400/1080 WebP variants on upload). The actual upload happens after the event
 * is created, since the upload endpoint needs an event id.
 */
export function EventImageUploader({
  value,
  onChange,
  existingImageUrl,
  title = 'Click or drag to upload a poster',
  hint = 'PNG, JPG or WebP — up to 10MB',
  disabled,
}: EventImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Build (and revoke) an object URL for the selected file.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const accept = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be smaller than 10MB');
      return;
    }
    onChange(file);
  };

  const shownImage = previewUrl ?? existingImageUrl ?? null;

  return (
    <div className="grid gap-2 min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          // Allow re-selecting the same file after a remove.
          e.target.value = '';
        }}
      />

      {shownImage ? (
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shownImage} alt="Event poster preview" className="aspect-video w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              disabled={disabled}
              onClick={() => onChange(null)}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs">{hint}</span>
        </button>
      )}
    </div>
  );
}
