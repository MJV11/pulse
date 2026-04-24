import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export interface ProfilePhoto {
  id: string
  storage_path: string
  position: number
  created_at: string
}

interface PhotosResponse {
  data: ProfilePhoto[]
}

/**
 * Fetches and manages the authenticated user's gallery photos.
 * Uploads go directly to Supabase Storage from the caller; this hook
 * handles recording the path via the API and keeping the list in sync.
 */
export function useProfilePhotos() {
  const { session } = useAuth()
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    apiFetch<PhotosResponse>('/users/me/photos', session.access_token)
      .then(({ data }) => setPhotos(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addPhoto(storagePath: string): Promise<ProfilePhoto> {
    if (!session?.access_token) throw new Error('Not authenticated')
    const { data } = await apiFetch<{ data: ProfilePhoto }>('/users/me/photos', session.access_token, {
      method: 'POST',
      body: JSON.stringify({ storage_path: storagePath, position: photos.length }),
    })
    setPhotos((prev) => [...prev, data])
    return data
  }

  async function removePhoto(photoId: string): Promise<void> {
    if (!session?.access_token) throw new Error('Not authenticated')
    await apiFetch(`/users/me/photos/${photoId}`, session.access_token, { method: 'DELETE' })
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  return { photos, loading, error, refresh, addPhoto, removePhoto }
}
