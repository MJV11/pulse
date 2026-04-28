import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { calculateAge } from '../../lib/age'
import type { NearbyUser } from '../../hooks/useDiscovery'
import { PiX, PiMapPin, PiImage } from 'react-icons/pi'

interface ProfilePhoto {
  id: string
  storage_path: string
  position: number
}

interface UserProfileModalProps {
  user: NearbyUser
  distanceLabel: string
  onClose: () => void
  onLike?: () => void
  onDislike?: () => void
}

const CHIP_STYLES = [
  { bg: 'bg-[rgba(254,226,226,0.5)]', text: 'text-[#dc2626]' },
  { bg: 'bg-[rgba(252,231,243,0.5)]', text: 'text-[#db2777]' },
  { bg: 'bg-[#fef2f2]',              text: 'text-[#b91c1c]' },
  { bg: 'bg-[#fdf2f8]',              text: 'text-[#be185d]' },
]

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from('gallery').getPublicUrl(storagePath).data.publicUrl
}

export function UserProfileModal({
  user,
  distanceLabel,
  onClose,
  onLike,
  onDislike,
}: UserProfileModalProps) {
  const { session } = useAuth()
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)

  const displayName = user.user_name ?? 'Unknown'
  const age = calculateAge(user.birthday)
  const nameWithAge = age != null ? `${displayName}, ${age}` : displayName

  useEffect(() => {
    if (!session?.access_token) return
    setPhotosLoading(true)
    apiFetch<{ data: ProfilePhoto[] }>(`/users/${user.user_id}/photos`, session.access_token)
      .then(({ data }) => setPhotos(data ?? []))
      .catch(() => setPhotos([]))
      .finally(() => setPhotosLoading(false))
  }, [user.user_id, session?.access_token])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[#fbf8ff] rounded-3xl shadow-[0px_25px_60px_0px_rgba(0,0,0,0.3)] w-full max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
          aria-label="Close"
        >
          <PiX size={20} className="text-[#64748b]" />
        </button>

        {/* Hero — name + location only */}
        <div className="bg-white rounded-t-3xl px-8 pt-8 pb-6 flex flex-col gap-2">
          <h2 className="text-[#1d1a20] font-extrabold text-2xl tracking-tight leading-none truncate pr-10">
            {nameWithAge}
          </h2>
          <div className="flex items-center gap-1.5">
            <PiMapPin size={14} className="text-[#94a3b8]" />
            <span className="text-[#94a3b8] text-sm font-medium">{distanceLabel}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 p-6">

          {user.bio && (
            <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h3 className="text-[#1d1a20] font-bold text-base mb-3">About</h3>
              <p className="text-[#534342] font-medium text-[15px] leading-relaxed">{user.bio}</p>
            </div>
          )}

          {user.sports.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h3 className="text-[#1d1a20] font-bold text-base mb-3">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {user.sports.map((sport, i) => {
                  const style = CHIP_STYLES[i % CHIP_STYLES.length]
                  return (
                    <span key={sport} className={`${style.bg} ${style.text} font-semibold text-sm px-4 py-1.5 rounded-full`}>
                      {sport}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <PiImage size={17} className="text-[#dc2626]" />
              <h3 className="text-[#1d1a20] font-bold text-base">Photos</h3>
            </div>

            {photosLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[#f1f5f9] rounded-xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <p className="text-[#94a3b8] text-sm italic">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl overflow-hidden aspect-square">
                    <img
                      src={getPublicUrl(photo.storage_path)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(onLike || onDislike) && (
          <div className="px-6 pb-6 flex gap-3">
            {onDislike && (
              <button
                onClick={() => { onDislike(); onClose() }}
                className="flex-1 py-4 rounded-2xl border-2 border-[#fee2e2] text-[#dc2626] font-semibold text-sm hover:bg-[#fef2f2] transition-colors"
              >
                Pass
              </button>
            )}
            {onLike && (
              <button
                onClick={() => { onLike(); onClose() }}
                className="flex-1 py-4 rounded-2xl text-white font-semibold text-sm shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                Like
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
