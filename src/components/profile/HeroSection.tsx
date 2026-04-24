import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/api'
import type { UserProfile } from '../../hooks/useProfile'
import { useReverseGeocode } from '../../hooks/useReverseGeocode'
import {
  PROFILE_COVER,
  PROFILE_ICON_LOCATION,
  PROFILE_ICON_SHARE,
  PROFILE_EDIT_CAMERA,
} from '../../lib/assets'

interface HeroSectionProps {
  userName: string | null
  rating: number | null
  avatarUrl: string | null
  latitude: number | null
  longitude: number | null
  userId: string
  isEditing: boolean
  onNameChange: (name: string) => void
  onAvatarUploaded: (url: string) => void
  onEditClick: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function makeInitialsAvatar(name: string | null): string {
  const label = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="148" height="148">`,
    `<rect width="148" height="148" rx="16" fill="#d90429"/>`,
    `<text x="74" y="96" text-anchor="middle" font-family="system-ui,sans-serif"`,
    ` font-weight="800" font-size="56" fill="white">${label}</text>`,
    `</svg>`,
  ].join('')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function HeroSection({
  userName,
  rating,
  avatarUrl,
  latitude,
  longitude,
  userId,
  isEditing,
  onNameChange,
  onAvatarUploaded,
  onEditClick,
  onSave,
  onCancel,
  saving,
}: HeroSectionProps) {
  const { session } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const cityName = useReverseGeocode(latitude, longitude)

  const displayName = userName ?? 'Your Name'
  const avatarSrc = avatarUrl ?? makeInitialsAvatar(userName)

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session?.access_token) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please choose a JPG, PNG, WebP, or GIF image.')
      return
    }

    setUploadingAvatar(true)
    setUploadError(null)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const storagePath = `${userId}/avatar.${ext}`

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, file, { upsert: true, contentType: file.type })

      if (storageError) throw new Error(storageError.message)

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(storagePath)

      // Save the URL immediately — no need to wait for full profile save
      await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      onAvatarUploaded(publicUrl)
    } catch (err) {
      setUploadError((err as Error).message ?? 'Upload failed')
    } finally {
      setUploadingAvatar(false)
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Cover */}
      <div className="relative h-80 bg-gray-100">
        <img
          src={PROFILE_COVER}
          alt="Cover"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Profile info row */}
      <div className="px-[33px] pb-[33px] -mt-24 flex items-end justify-between">
        {/* Avatar + name */}
        <div className="flex items-end gap-6">
          {/* Avatar card */}
          <div className="relative bg-white rounded-3xl p-[6px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)]">
            <img
              src={avatarSrc}
              alt={displayName}
              className={`w-[148px] h-[148px] rounded-2xl object-cover transition-opacity ${uploadingAvatar ? 'opacity-50' : 'opacity-100'}`}
            />
            {uploadingAvatar && (
              <div className="absolute inset-[6px] rounded-2xl flex items-center justify-center bg-black/10">
                <svg className="animate-spin w-8 h-8 text-[#dc2626]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 disabled:opacity-60"
              aria-label="Change profile photo"
            >
              <img src={PROFILE_EDIT_CAMERA} alt="" className="w-[42px] h-[42px] object-contain" />
            </button>
          </div>

          {/* Name + rating + location */}
          <div className="pb-2 flex flex-col gap-1.5">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={userName ?? ''}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                placeholder="Your name"
                className="text-[#1d1a20] font-extrabold text-[28px] tracking-tight leading-none border-b-2 border-[#dc2626] bg-transparent outline-none placeholder:text-[#94a3b8] w-full max-w-[280px]"
              />
            ) : (
              <h1 className="text-[#1d1a20] font-extrabold text-[32px] tracking-tight leading-none">
                {displayName}
              </h1>
            )}
            {rating != null ? (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1l1.618 3.28 3.617.527-2.618 2.551.618 3.601L7 9.25l-3.235 1.709.618-3.601L1.765 4.807l3.617-.527L7 1z"
                        fill={i < Math.round(rating) ? '#fbbf24' : '#e5e7eb'}
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-[#534342] text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[#94a3b8] text-sm">No rating yet</span>
            )}

            {/* Location */}
            {(cityName != null || (latitude != null && longitude != null)) && (
              <div className="flex items-center gap-1">
                <img src={PROFILE_ICON_LOCATION} alt="" className="w-3 h-[15px] object-contain" />
                <span className="text-[#534342] text-base">
                  {cityName ?? `${latitude!.toFixed(2)}, ${longitude!.toFixed(2)}`}
                </span>
              </div>
            )}

            {uploadError && (
              <p className="text-[#dc2626] text-xs font-medium mt-1">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pb-2">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="border border-[#e2e8f0] text-[#64748b] font-semibold text-[14px] px-6 py-[15px] rounded-2xl hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving || !userName?.trim()}
                className="bg-[#dc2626] text-white font-semibold text-[14px] px-6 py-[15px] rounded-2xl shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEditClick}
                className="bg-[#dc2626] text-white font-semibold text-[14px] px-6 py-[15px] rounded-2xl shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity"
              >
                Edit Profile
              </button>
              <button className="bg-[#fef2f2] p-3 rounded-2xl hover:bg-[#fee2e2] transition-colors">
                <img src={PROFILE_ICON_SHARE} alt="Share" className="w-[18px] h-[20px] object-contain" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
