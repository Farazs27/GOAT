"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, X, Check, RotateCcw, Upload } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Kan geen toegang krijgen tot de camera. Controleer de camera-instellingen.",
      );
      setIsCapturing(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirm = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  const toggleCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => startCamera(), 100);
  }, [stopCamera, startCamera]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCapturedImage(event.target.result as string);
            setIsCapturing(false);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  );

  if (!isCapturing && !capturedImage && !error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Foto maken
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={startCamera}
              className="w-full py-4 px-6 bg-[var(--accent)] text-white rounded-xl font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Camera className="w-6 h-6" />
              Camera openen
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-color)]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--bg-card)] px-4 text-sm text-[var(--text-tertiary)]">
                  of
                </span>
              </div>
            </div>

            <label className="w-full py-4 px-6 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer">
              <Upload className="w-6 h-6" />
              Foto uploaden
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Camera fout
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setError(null)}
                className="flex-1 py-3 px-4 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Opnieuw proberen
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl">
          <div className="relative mb-4">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-2xl"
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={retake}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Opnieuw
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Check className="w-5 h-5" />
              Gebruiken
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Overlay controls */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-3 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={toggleCamera}
              className="p-3 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Capture button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
            <button
              onClick={captureImage}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          </div>

          {/* Guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-80 border-2 border-white/50 rounded-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70 text-sm font-medium">
                Positioneer gezicht hier
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
