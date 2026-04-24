import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useProfilePhotos } from '../../hooks/useProfilePhotos'
import { PiImage, PiPlus, PiTrash, PiSpinner } from 'react-icons/pi'

const MAX_PHOTOS = 9
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from('gallery').getPublicUrl(storagePath).data.publicUrl
}

interface MediaGalleryProps {
  userId: string
}

export function MediaGallery({ userId }: MediaGalleryProps) {
  const { session } = useAuth()
  const { photos, loading, addPhoto, removePhoto } = useProfilePhotos()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session?.access_token) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please choose a JPG, PNG, WebP, or GIF image.')
      return
    }

    if (photos.length >= MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed.`)
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .upload(storagePath, file, { contentType: file.type })

      if (storageError) throw new Error(storageError.message)

      await addPhoto(storagePath)
    } catch (err) {
      setUploadError((err as Error).message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId)
    try {
      await removePhoto(photoId)
    } finally {
      setDeletingId(null)
    }
  }

  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="col-span-3 flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiImage size={18} className="text-[#dc2626]" />
          <h2 className="text-[#1d1a20] font-bold text-xl">Photos</h2>
          {photos.length > 0 && (
            <span className="text-[#94a3b8] text-sm font-medium">{photos.length}/{MAX_PHOTOS}</span>
          )}
        </div>
        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[#dc2626] font-semibold text-sm hover:underline disabled:opacity-50"
          >
            <PiPlus size={16} />
            Add Photo
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="text-[#dc2626] text-sm font-medium bg-[#fef2f2] rounded-xl px-4 py-2.5">
          {uploadError}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#f1f5f9] rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-[rgba(254,242,242,0.3)] border-2 border-dashed border-[#fee2e2] rounded-2xl py-16 flex flex-col items-center gap-3 hover:bg-[#fef2f2]/50 transition-colors disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center">
            <PiImage size={28} className="text-[#dc2626]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#1d1a20] font-semibold text-sm">Add your first photo</span>
            <span className="text-[#94a3b8] text-xs">JPG, PNG, WebP or GIF</span>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {photos.map((photo) => (
            <GalleryItem
              key={photo.id}
              src={getPublicUrl(photo.storage_path)}
              isDeleting={deletingId === photo.id}
              onDelete={() => handleDelete(photo.id)}
            />
          ))}

          {/* Upload in-progress placeholder */}
          {uploading && (
            <div className="bg-[#f1f5f9] rounded-2xl aspect-[3/4] flex items-center justify-center">
              <PiSpinner size={28} className="text-[#dc2626] animate-spin" />
            </div>
          )}

          {/* Add more slot */}
          {canAddMore && !uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[rgba(254,242,242,0.3)] border-2 border-dashed border-[#fee2e2] rounded-2xl aspect-[3/4] flex flex-col items-center justify-center gap-2 hover:bg-[#fef2f2]/50 transition-colors"
            >
              <PiPlus size={24} className="text-[#f87171]" />
              <span className="text-[#f87171] font-semibold text-xs">Add Photo</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface GalleryItemProps {
  src: string
  isDeleting: boolean
  onDelete: () => void
}

function GalleryItem({ src, isDeleting, onDelete }: GalleryItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] aspect-[3/4]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isDeleting ? 'opacity-40' : 'opacity-100'}`}
      />

      {/* Hover overlay with delete button */}
      {(hovered || isDeleting) && (
        <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-white/90 hover:bg-white rounded-xl p-1.5 transition-colors disabled:opacity-50"
            aria-label="Delete photo"
          >
            {isDeleting
              ? <PiSpinner size={16} className="text-[#dc2626] animate-spin" />
              : <PiTrash size={16} className="text-[#dc2626]" />
            }
          </button>
        </div>
      )}
    </div>
  )
}
