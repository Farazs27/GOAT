"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
} from "lucide-react";

interface XRayImage {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  imageType: string;
  notes?: string;
  createdAt: string;
  uploader?: {
    firstName: string;
    lastName: string;
  };
}

interface XRayLightboxProps {
  images: XRayImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownload: (image: XRayImage) => void;
  compareMode?: boolean;
  compareIndex?: number;
}

export function XRayLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
  compareMode = false,
  compareIndex,
}: XRayLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  const compareImage =
    compareMode && compareIndex !== undefined ? images[compareIndex] : null;

  // Reset state when image changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case "ArrowRight":
          if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.25, 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale],
  );

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      (e.currentTarget as any).initialPinchDistance = distance;
      (e.currentTarget as any).initialScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const initialDistance = (e.currentTarget as any).initialPinchDistance;
      const initialScale = (e.currentTarget as any).initialScale || 1;
      if (initialDistance) {
        const newScale = Math.min(
          Math.max(initialScale * (distance / initialDistance), 0.25),
          5,
        );
        setScale(newScale);
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      XRAY: "Röntgen",
      INTRAORAL: "Intraoraal",
      EXTRAORAL: "Extraoraal",
      OTHER: "Overig",
    };
    return labels[type] || type;
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-white/40 text-sm truncate max-w-[200px] sm:max-w-[400px]">
            {currentImage.fileName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-xl transition-all ${
              showInfo
                ? "bg-[#e8945a]/20 text-[#e8945a]"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
            title="Informatie"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title={isFullscreen ? "Volledig scherm sluiten" : "Volledig scherm"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Sluiten (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image viewer */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Compare mode: side by side */}
          {compareMode && compareImage ? (
            <div className="flex w-full h-full">
              <div className="flex-1 relative border-r border-white/10">
                <ImageViewer
                  image={currentImage}
                  scale={scale}
                  rotation={rotation}
                  position={position}
                  isDragging={isDragging}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onLoad={() => setIsLoading(false)}
                  isLoading={isLoading}
                  label="Huidig"
                />
              </div>
              <div className="flex-1 relative">
                <ImageViewer
                  image={compareImage}
                  scale={scale}
                  rotation={rotation}
                  position={position}
                  isDragging={isDragging}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onLoad={() => setIsLoading(false)}
                  isLoading={isLoading}
                  label="Vergelijking"
                />
              </div>
            </div>
          ) : (
            <ImageViewer
              image={currentImage}
              scale={scale}
              rotation={rotation}
              position={position}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onLoad={() => setIsLoading(false)}
              isLoading={isLoading}
            />
          )}

          {/* Navigation arrows */}
          {!compareMode && images.length > 1 && (
            <>
              <button
                onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/50 text-white/80 hover:bg-black/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  currentIndex < images.length - 1 &&
                  onNavigate(currentIndex + 1)
                }
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/50 text-white/80 hover:bg-black/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="w-72 bg-black/50 border-l border-white/10 p-4 overflow-y-auto hidden lg:block">
            <div className="space-y-4">
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Bestandsnaam
                </h3>
                <p className="text-white/90 text-sm break-all">
                  {currentImage.fileName}
                </p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Type
                </h3>
                <p className="text-white/90 text-sm">
                  {getImageTypeLabel(currentImage.imageType)}
                </p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Datum
                </h3>
                <p className="text-white/90 text-sm">
                  {new Date(currentImage.createdAt).toLocaleDateString(
                    "nl-NL",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Grootte
                </h3>
                <p className="text-white/90 text-sm">
                  {formatFileSize(currentImage.fileSize)}
                </p>
              </div>
              {currentImage.uploader && (
                <div>
                  <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Geüpload door
                  </h3>
                  <p className="text-white/90 text-sm">
                    {currentImage.uploader.firstName}{" "}
                    {currentImage.uploader.lastName}
                  </p>
                </div>
              )}
              {currentImage.notes && (
                <div>
                  <h3 className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Notities
                  </h3>
                  <p className="text-white/70 text-sm">{currentImage.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/50 border-t border-white/10">
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Uitzoomen (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white/50 text-sm w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Inzoomen (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button
          onClick={handleRotate}
          className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Roteer 90°"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Reset (0)"
        >
          Reset
        </button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button
          onClick={() => onDownload(currentImage)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e8945a]/20 text-[#e8945a] hover:bg-[#e8945a]/30 transition-all"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Download</span>
        </button>
      </div>
    </div>
  );
}

interface ImageViewerProps {
  image: XRayImage;
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onLoad: () => void;
  isLoading: boolean;
  label?: string;
}

function ImageViewer({
  image,
  scale,
  rotation,
  position,
  isDragging,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onLoad,
  isLoading,
  label,
}: ImageViewerProps) {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
      }}
    >
      {label && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 text-white/80 text-sm font-medium z-10">
          {label}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#e8945a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.filePath}
        alt={image.fileName}
        className="max-w-full max-h-full object-contain transition-transform duration-100"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
        }}
        onLoad={onLoad}
        draggable={false}
      />
    </div>
  );
}
