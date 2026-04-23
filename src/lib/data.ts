import {
  AVATAR_ALEX,
  AVATAR_CHLOE,
  AVATAR_ELENA,
  AVATAR_LEO,
  AVATAR_MARCUS,
  AVATAR_MAYA,
  AVATAR_MAYA_SM,
  AVATAR_MAYA_SM2,
  AVATAR_SARAH,
  AVATAR_SASHA,
  CHAT_PHOTO_JAZZ,
  DISCOVERY_CARD_PHOTO,
} from './assets'

// ── Core types ─────────────────────────────────────────────────────────────

export interface Match {
  id: string
  name: string
  avatar: string
  online?: boolean
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: boolean
  online?: boolean
}

export type MessageType = 'sent' | 'received'

export interface Message {
  id: string
  type: MessageType
  content: string
  time: string
  avatar?: string
  image?: string
  reacted_with?: string
}

export interface DiscoveryProfile {
  id: string
  name: string
  age?: number
  photo?: string
  distance: string
  verified: boolean
  interests: string[]
}

export interface Interest {
  id: string
  label: string
  colorClass: string
  textClass: string
}

export interface GalleryPhoto {
  id: string
  src: string
  label?: string
}

// ── Maps ───────────────────────────────────────────────────────────────────

export const newMatches = new Map<string, Match>([
  ['sarah', { id: 'sarah', name: 'Sarah', avatar: AVATAR_SARAH, online: true }],
  ['elena', { id: 'elena', name: 'Elena', avatar: AVATAR_ELENA }],
  ['marcus', { id: 'marcus', name: 'Marcus', avatar: AVATAR_MARCUS }],
  ['chloe', { id: 'chloe', name: 'Chloe', avatar: AVATAR_CHLOE }],
])

export const conversations = new Map<string, Conversation>([
  [
    'maya-jensen',
    {
      id: 'maya-jensen',
      name: 'Maya Jensen',
      avatar: AVATAR_MAYA,
      lastMessage: 'That sounds like an amazing plan! ☕️',
      time: '2m',
      unread: true,
      online: true,
    },
  ],
  [
    'leo-chen',
    {
      id: 'leo-chen',
      name: 'Leo Chen',
      avatar: AVATAR_LEO,
      lastMessage: 'Maybe next Tuesday then?',
      time: '1h',
      unread: false,
    },
  ],
  [
    'sasha-gray',
    {
      id: 'sasha-gray',
      name: 'Sasha Gray',
      avatar: AVATAR_SASHA,
      lastMessage: 'You sent a photo',
      time: '3h',
      unread: false,
    },
  ],
])

export const messageThreads = new Map<string, Message[]>([
  [
    'maya-jensen',
    [
      {
        id: '1',
        type: 'received',
        content: 'Hey! I saw your profile mention you love jazz.\nHave you ever been to The Blue Note?',
        time: '10:42 AM',
        avatar: AVATAR_MAYA_SM,
      },
      {
        id: '2',
        type: 'sent',
        content: 'Actually yes! I was there last month for the Roy Hargrove tribute. It was electric! 🎺',
        time: '10:45 AM',
      },
      {
        id: '3',
        type: 'received',
        content: "No way! I missed that one. I'm usually there on Wednesdays for the open jam sessions.",
        time: '',
        avatar: AVATAR_MAYA_SM2,
      },
      {
        id: '4',
        type: 'received',
        content: 'That sounds like an amazing plan! ☕️',
        time: '10:48 AM',
      },
      {
        id: '5',
        type: 'sent',
        content: 'Check this out! Captured this the last time I was there.',
        time: '10:50 AM',
        image: CHAT_PHOTO_JAZZ,
      },
    ],
  ],
])

export const discoveryProfiles = new Map<string, DiscoveryProfile>([
  [
    'julian',
    {
      id: 'julian',
      name: 'Julian',
      age: 26,
      photo: DISCOVERY_CARD_PHOTO,
      distance: '2 miles away',
      verified: true,
      interests: ['Architecture', 'Cooking', 'Hiking'],
    },
  ],
])

export const interests = new Map<string, Interest>([
  ['photography', { id: 'photography', label: 'Photography', colorClass: 'bg-[rgba(254,226,226,0.5)]', textClass: 'text-[#dc2626]' }],
  ['sailing', { id: 'sailing', label: 'Sailing', colorClass: 'bg-[rgba(252,231,243,0.5)]', textClass: 'text-[#db2777]' }],
  ['jazz', { id: 'jazz', label: 'Jazz', colorClass: 'bg-[#fef2f2]', textClass: 'text-[#b91c1c]' }],
  ['hiking', { id: 'hiking', label: 'Hiking', colorClass: 'bg-[#fdf2f8]', textClass: 'text-[#be185d]' }],
  ['coffee', { id: 'coffee', label: 'Coffee', colorClass: 'bg-[rgba(254,226,226,0.5)]', textClass: 'text-[#dc2626]' }],
  ['travel', { id: 'travel', label: 'Travel', colorClass: 'bg-[rgba(252,231,243,0.5)]', textClass: 'text-[#db2777]' }],
])

export const galleryPhotos = new Map<string, GalleryPhoto>([
  ['gallery-1', { id: 'gallery-1', src: 'https://www.figma.com/api/mcp/asset/c42de5b7-5608-425b-8867-4a73f00005a1' }],
  ['gallery-2', { id: 'gallery-2', src: 'https://www.figma.com/api/mcp/asset/f9551697-90d9-4077-972d-f04f1be246f2', label: 'SAFE FOR WORK' }],
  ['gallery-3', { id: 'gallery-3', src: 'https://www.figma.com/api/mcp/asset/bc427e46-8b8d-4899-998e-cd2ee67419de', label: 'GALLERY 3' }],
])

export const currentUser = {
  id: 'alex-rivera',
  name: 'Alex Rivera',
  avatar: AVATAR_ALEX,
  plan: 'Pulse Premium',
  profileAvatar: 'https://www.figma.com/api/mcp/asset/40de6f16-b16e-4b95-9378-e82c807b5159',
}
