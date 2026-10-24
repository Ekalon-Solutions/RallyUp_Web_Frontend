'use client';

import { useEffect, useRef, useState } from 'react';
import { Crop, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
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
  /** Width / height the poster is rendered at; the picked image is cropped to it. */
  aspect?: number;
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
  aspect = 16 / 9,
}: EventImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Uncropped pick, kept so "Crop" re-crops from the original rather than a crop of a crop.
  const [original, setOriginal] = useState<File | null>(null);
  const [cropping, setCropping] = useState(false);

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
    setOriginal(file);
    setCropping(true);
  };

  const shownImage = previewUrl ?? existingImageUrl ?? null;

  return (
    <div className="grid gap-2 min-w-0">
      {cropping && original && (
        <CropDialog
          file={original}
          aspect={aspect}
          onCancel={() => setCropping(false)}
          onDone={(cropped) => {
            setCropping(false);
            onChange(cropped);
          }}
        />
      )}

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
          <img
            src={shownImage}
            alt="Event poster preview"
            className="w-full object-cover"
            style={{ aspectRatio: aspect }}
          />
          <div className="absolute right-2 top-2 flex gap-2">
            {value && original && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={disabled}
                onClick={() => setCropping(true)}
              >
                <Crop className="mr-1 h-4 w-4" />
                Crop
              </Button>
            )}
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
              onClick={() => {
                setOriginal(null);
                onChange(null);
              }}
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
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          style={{ aspectRatio: aspect }}
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs">{hint}</span>
        </button>
      )}
    </div>
  );
}

const MAX_OUTPUT_WIDTH = 2160; // 2x the largest (1080) variant the backend generates

/**
 * Fixed-aspect crop: drag to pan, slider to zoom, exported via canvas at the source's
 * resolution (capped). The frame matches how the poster renders (object-cover), so
 * what's inside the frame is exactly what viewers see.
 */
function CropDialog({
  file,
  aspect,
  onCancel,
  onDone,
}: {
  file: File;
  aspect: number;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frameW, setFrameW] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Image's top-left inside the frame, in frame pixels (always <= 0 so it covers the frame).
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const frameH = frameW / aspect;
  const scaleFor = (z: number) => (nat ? Math.max(frameW / nat.w, frameH / nat.h) * z : 1);
  const scale = scaleFor(zoom);
  const clamp = (p: { x: number; y: number }, s: number) => ({
    x: Math.min(0, Math.max(frameW - nat!.w * s, p.x)),
    y: Math.min(0, Math.max(frameH - nat!.h * s, p.y)),
  });

  const onLoad = () => {
    const img = imgRef.current!;
    // ponytail: frame size measured once on load; dialog width is fixed, so no ResizeObserver.
    const w = frameRef.current!.clientWidth;
    const h = w / aspect;
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
    setFrameW(w);
    setZoom(1);
    setPos({ x: (w - img.naturalWidth * s) / 2, y: (h - img.naturalHeight * s) / 2 });
  };

  const changeZoom = (z: number) => {
    if (!nat) return;
    // Zoom around the frame centre.
    const cx = (frameW / 2 - pos.x) / scale;
    const cy = (frameH / 2 - pos.y) / scale;
    const s = scaleFor(z);
    setZoom(z);
    setPos(clamp({ x: frameW / 2 - cx * s, y: frameH / 2 - cy * s }, s));
  };

  const save = () => {
    if (!nat || !imgRef.current) return;
    const sw = frameW / scale;
    const sh = frameH / scale;
    const outW = Math.round(Math.min(sw, MAX_OUTPUT_WIDTH));
    const outH = Math.round(outW / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    canvas
      .getContext('2d')!
      .drawImage(imgRef.current, -pos.x / scale, -pos.y / scale, sw, sh, 0, 0, outW, outH);
    // Keep PNG/WebP (transparency); everything else becomes JPEG.
    const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (!blob) return toast.error('Could not crop this image');
        if (blob.size > MAX_BYTES) return toast.error('Cropped image is larger than 10MB');
        const ext = type.split('/')[1].replace('jpeg', 'jpg');
        onDone(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type }));
      },
      type,
      0.92
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop poster</DialogTitle>
        </DialogHeader>
        <div
          ref={frameRef}
          className="relative w-full cursor-move touch-none select-none overflow-hidden rounded-lg bg-muted"
          style={{ aspectRatio: aspect }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || !nat) return;
            setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }, scale));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              draggable={false}
              onLoad={onLoad}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={
                nat
                  ? { width: nat.w * scale, height: nat.h * scale, transform: `translate(${pos.x}px, ${pos.y}px)` }
                  : { visibility: 'hidden' }
              }
            />
          )}
          {/* Rule-of-thirds guide, LinkedIn-style; purely visual. */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border-2 border-white/90 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className={cn('border-white/70', i % 3 < 2 && 'border-r', i < 6 && 'border-b')}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Slider min={1} max={3} step={0.01} value={[zoom]} onValueChange={([z]) => changeZoom(z)} />
        </div>
        <p className="text-xs text-muted-foreground">Drag to reposition. The framed area is exactly what's shown on the event.</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!nat}>
            Apply crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
