'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';

interface ImageLayerProps {
  imageUrl: string | null;
  displayWidth: number;
  onLoad: (naturalWidth: number, naturalHeight: number) => void;
}

export function ImageLayer({ imageUrl, displayWidth, onLoad }: ImageLayerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const loadedUrl = useRef<string | null>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (!imageUrl || imageUrl === loadedUrl.current) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      loadedUrl.current = imageUrl;
      onLoadRef.current(img.naturalWidth, img.naturalHeight);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (!image) return null;

  const scale = displayWidth / image.naturalWidth;
  const displayHeight = image.naturalHeight * scale;

  return (
    <KonvaImage
      image={image}
      width={displayWidth}
      height={displayHeight}
      listening={false}
    />
  );
}
