"use client";

import { useState, useEffect } from "react";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";

interface PatientPhoto {
  id: string;
  filePath: string;
  imageType: string;
  notes?: string;
  createdAt: string;
}

interface PatientPhotoGalleryProps {
  patientId: string;
  maxDisplay?: number;
  showMainOnly?: boolean;
}

export default function PatientPhotoGallery({
  patientId,
  maxDisplay = 6,
  showMainOnly = false,
}: PatientPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [patientId]);

  const fetchPhotos = async () => {
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("patient_token");
      const response = await fetch(
        `/api/patient-images?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPhotos(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const profilePhotos = photos.filter((p) => p.imageType === "PROFILE");
  const displayPhotos = showMainOnly
    ? profilePhotos.slice(0, 1)
    : photos.slice(0, maxDisplay);
  const mainPhoto = profilePhotos[0];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-32 h-32 rounded-2xl bg-[var(--bg-card)]" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-32 h-32 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)]">
        <Camera className="w-8 h-8" />
        <span className="text-xs">Geen foto</span>
      </div>
    );
  }

  if (showMainOnly && mainPhoto) {
    return (
      <div className="relative group">
        <div
          className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/30 cursor-pointer"
          onClick={() => setSelectedPhoto(0)}
        >
          <img
            src={mainPhoto.filePath}
            alt="Profielfoto"
            className="w-full h-full object-cover"
          />
        </div>

        {selectedPhoto !== null && (
          <PhotoModal
            photos={profilePhotos}
            currentIndex={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onNext={() =>
              setSelectedPhoto((prev) => (prev! + 1) % profilePhotos.length)
            }
            onPrev={() =>
              setSelectedPhoto(
                (prev) =>
                  (prev! - 1 + profilePhotos.length) % profilePhotos.length,
              )
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent)]/50 transition-colors group"
            onClick={() => setSelectedPhoto(index)}
          >
            <img
              src={photo.filePath}
              alt={photo.notes || `Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {photo.imageType === "PROFILE" && (
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[var(--accent)] text-white text-[10px] font-medium rounded-full">
                Profiel
              </div>
            )}
            {photo.notes && (
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs truncate block">
                  {photo.notes}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length > maxDisplay && (
        <p className="text-sm text-[var(--text-tertiary)] text-center">
          +{photos.length - maxDisplay} meer foto's
        </p>
      )}

      {selectedPhoto !== null && (
        <PhotoModal
          photos={photos}
          currentIndex={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onNext={() => setSelectedPhoto((prev) => (prev! + 1) % photos.length)}
          onPrev={() =>
            setSelectedPhoto(
              (prev) => (prev! - 1 + photos.length) % photos.length,
            )
          }
        />
      )}
    </div>
  );
}

interface PhotoModalProps {
  photos: PatientPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function PhotoModal({
  photos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: PhotoModalProps) {
  const photo = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="relative max-w-4xl max-h-[90vh] flex items-center">
        {photos.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div className="flex flex-col items-center">
          <img
            src={photo.filePath}
            alt={photo.notes || `Foto ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
          <div className="mt-4 text-center">
            <p className="text-white font-medium">{photo.notes}</p>
            <p className="text-white/50 text-sm">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        </div>

        {photos.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
