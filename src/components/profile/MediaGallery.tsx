import type { GalleryPhoto } from '../../lib/data'
import { galleryPhotos } from '../../lib/data'
import { PROFILE_ADD_PHOTO } from '../../lib/assets'

/**
 * 4-column media gallery grid with photos and an add-photo placeholder.
 */
export function MediaGallery() {
  const photos = Array.from(galleryPhotos.values())

  return (
    <div className="col-span-3 grid grid-cols-4 gap-4">
      {photos.map((photo) => (
        <GalleryItem key={photo.id} photo={photo} />
      ))}
      <AddPhotoSlot />
    </div>
  )
}

function GalleryItem({ photo }: { photo: GalleryPhoto }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] aspect-[3/4]">
      <img src={photo.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {photo.label && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
          <span className="text-white font-semibold text-xs tracking-wider">{photo.label}</span>
          {photo.label.toLowerCase().includes('safe') && (
            <span className="text-white/70 text-[10px]">Safe for work</span>
          )}
        </div>
      )}
    </div>
  )
}

function AddPhotoSlot() {
  return (
    <button className="bg-[rgba(254,242,242,0.3)] border-4 border-dashed border-[#fee2e2] rounded-2xl aspect-[3/4] flex flex-col items-center justify-center gap-2 hover:bg-[#fef2f2]/50 transition-colors">
      <img src={PROFILE_ADD_PHOTO} alt="" className="w-[33px] h-[38px] object-contain" />
      <span className="text-[#f87171] font-semibold text-[14px]">Add Photo</span>
    </button>
  )
}
