import { useState, KeyboardEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import { calculateAge, maxBirthdayForMinAge, minBirthday, MIN_AGE } from '../../lib/age'
import type { Gender, LookingFor, UserProfile } from '../../hooks/useProfile'

interface SetupProfileFlowProps {
  /** Pre-filled values when opened from "Edit Profile" */
  initialValues?: Partial<
    Pick<UserProfile, 'user_name' | 'bio' | 'birthday' | 'sports' | 'gender' | 'looking_for'>
  >
  onComplete: (profile: UserProfile) => void
  onDismiss?: () => void
  /** "setup" shows the branded onboarding framing; "edit" shows a simpler title */
  mode?: 'setup' | 'edit'
}

const SPORT_SUGGESTIONS = [
  'Basketball', 'Soccer', 'Tennis', 'Running', 'Swimming', 'Cycling',
  'Volleyball', 'Baseball', 'Football', 'Golf', 'Yoga', 'Climbing',
  'Skiing', 'Surfing', 'Boxing', 'CrossFit',
]

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'nonbinary', label: 'Non-binary' },
]

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'nonbinary', label: 'Non-binary people' },
  { value: 'all', label: 'Everyone' },
]

const STEPS = ['Name', 'Birthday', 'Gender', 'Looking for', 'Bio', 'Sports'] as const

/**
 * Multi-step profile setup / edit wizard rendered as a full-screen overlay.
 * Submits to PUT /api/users/me on completion.
 */
export function SetupProfileFlow({
  initialValues,
  onComplete,
  onDismiss,
  mode = 'setup',
}: SetupProfileFlowProps) {
  const { session } = useAuth()
  const [step, setStep] = useState(0)
  const [userName, setUserName] = useState(initialValues?.user_name ?? '')
  const [birthday, setBirthday] = useState<string>(initialValues?.birthday ?? '')
  const [gender, setGender] = useState<Gender | ''>(initialValues?.gender ?? '')
  const [lookingFor, setLookingFor] = useState<LookingFor | ''>(initialValues?.looking_for ?? '')
  const [bio, setBio] = useState(initialValues?.bio ?? '')
  const [sports, setSports] = useState<string[]>(initialValues?.sports ?? [])
  const [sportInput, setSportInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const birthdayAge = calculateAge(birthday)
  const birthdayMax = maxBirthdayForMinAge(MIN_AGE)
  const birthdayMin = minBirthday()
  const birthdayValid =
    !!birthday && birthdayAge !== null && birthdayAge >= MIN_AGE && birthdayAge < 120

  function addSport(value: string) {
    const trimmed = value.trim()
    if (!trimmed || sports.includes(trimmed)) return
    setSports((prev) => [...prev, trimmed])
    setSportInput('')
  }

  function removeSport(sport: string) {
    setSports((prev) => prev.filter((s) => s !== sport))
  }

  function handleSportKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSport(sportInput)
    }
    if (e.key === 'Backspace' && !sportInput && sports.length > 0) {
      setSports((prev) => prev.slice(0, -1))
    }
  }

  function canAdvance() {
    if (step === 0) return userName.trim().length > 0
    if (step === 1) return birthdayValid
    if (step === 2) return gender !== ''
    if (step === 3) return lookingFor !== ''
    if (step === 4) return true // bio is optional
    if (step === 5) return true // sports optional
    return true
  }

  async function handleFinish() {
    if (!session?.access_token) return
    setError(null)
    setSaving(true)
    try {
      const { data } = await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({
          user_name: userName.trim() || null,
          birthday: birthday || null,
          gender: gender || null,
          looking_for: lookingFor || null,
          bio: bio.trim() || null,
          sports,
        }),
      })
      onComplete(data)
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleFinish()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-[0px_25px_60px_0px_rgba(0,0,0,0.2)] w-full max-w-md mx-4 overflow-hidden">

        {/* Brand header strip */}
        <div
          className="px-8 pt-8 pb-6"
          style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-extrabold text-2xl">Pulse</span>
            {onDismiss && mode === 'edit' && (
              <button
                onClick={onDismiss}
                className="text-white/70 hover:text-white transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>

          <h2 className="text-white font-extrabold text-[22px] leading-snug">
            {mode === 'setup'
              ? [
                  'Set up your profile',
                  'When were you born?',
                  'How do you identify?',
                  'Who are you looking for?',
                  'Tell your story',
                  'Your sports',
                ][step]
              : [
                  'Edit your name',
                  'Edit your birthday',
                  'Edit your gender',
                  'Edit who you’re looking for',
                  'Edit your bio',
                  'Edit your sports',
                ][step]}
          </h2>
          <p className="text-white/75 text-sm mt-1">
            {[
              "What should people call you?",
              `We use your birthday to show your age. You must be at least ${MIN_AGE}.`,
              "We'll show this on your profile.",
              "We'll only show you people you'd be interested in.",
              "Share a little about yourself — it's optional.",
              "What sports are you into? Add as many as you like.",
            ][step]}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mt-5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-white' : i < step ? 'w-3 bg-white/60' : 'w-3 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 py-7 flex flex-col gap-5">
          {step === 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-[#534342] font-semibold text-sm uppercase tracking-wide">
                Display name
              </label>
              <input
                autoFocus
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canAdvance() && handleNext()}
                placeholder="e.g. Alex Rivera"
                className="w-full border border-[#fecaca] rounded-2xl px-4 py-3 text-[#1d1a20] text-base outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8]"
              />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2">
              <label className="text-[#534342] font-semibold text-sm uppercase tracking-wide">
                Birthday
              </label>
              <input
                autoFocus
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canAdvance() && handleNext()}
                min={birthdayMin}
                max={birthdayMax}
                className="w-full border border-[#fecaca] rounded-2xl px-4 py-3 text-[#1d1a20] text-base outline-none focus:ring-2 focus:ring-[#dc2626]/30"
              />
              {birthday && birthdayAge !== null && birthdayAge < MIN_AGE && (
                <span className="text-[#dc2626] text-xs font-medium">
                  You must be at least {MIN_AGE} years old to use Pulse.
                </span>
              )}
              {birthdayValid && (
                <span className="text-[#94a3b8] text-xs">You'll appear as {birthdayAge} on your profile.</span>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2">
              <label className="text-[#534342] font-semibold text-sm uppercase tracking-wide">
                I am a…
              </label>
              <div className="grid grid-cols-1 gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const selected = gender === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border text-base font-semibold transition-colors ${
                        selected
                          ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]'
                          : 'border-[#fecaca] bg-white text-[#1d1a20] hover:bg-[#fef2f2]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              <label className="text-[#534342] font-semibold text-sm uppercase tracking-wide">
                Show me…
              </label>
              <div className="grid grid-cols-1 gap-2">
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const selected = lookingFor === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setLookingFor(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border text-base font-semibold transition-colors ${
                        selected
                          ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]'
                          : 'border-[#fecaca] bg-white text-[#1d1a20] hover:bg-[#fef2f2]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-2">
              <label className="text-[#534342] font-semibold text-sm uppercase tracking-wide">
                Bio <span className="text-[#94a3b8] normal-case font-normal">(optional)</span>
              </label>
              <textarea
                autoFocus
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What makes you, you?"
                rows={4}
                className="w-full border border-[#fecaca] rounded-2xl px-4 py-3 text-[#1d1a20] text-base outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8] resize-none leading-relaxed"
              />
              <span className="text-[#94a3b8] text-xs text-right">{bio.length}/280</span>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              {/* Tag pills */}
              {sports.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <span
                      key={sport}
                      className="flex items-center gap-1.5 bg-[#fef2f2] text-[#dc2626] font-semibold text-sm px-3 py-1.5 rounded-full"
                    >
                      {sport}
                      <button
                        onClick={() => removeSport(sport)}
                        className="text-[#dc2626]/60 hover:text-[#dc2626] leading-none"
                        aria-label={`Remove ${sport}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Text input */}
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={sportInput}
                  onChange={(e) => setSportInput(e.target.value)}
                  onKeyDown={handleSportKeyDown}
                  placeholder="Type a sport and press Enter"
                  className="flex-1 border border-[#fecaca] rounded-2xl px-4 py-3 text-[#1d1a20] text-base outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8]"
                />
                <button
                  onClick={() => addSport(sportInput)}
                  className="px-4 py-3 rounded-2xl text-white font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
                >
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2">
                <p className="text-[#94a3b8] text-xs font-medium">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {SPORT_SUGGESTIONS.filter((s) => !sports.includes(s)).map((s) => (
                    <button
                      key={s}
                      onClick={() => addSport(s)}
                      className="bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-medium text-sm px-3 py-1.5 rounded-full hover:bg-[#fef2f2] hover:border-[#fecaca] hover:text-[#dc2626] transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-[#dc2626] text-sm font-medium bg-[#fef2f2] rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-[#64748b] font-semibold text-sm hover:text-[#1d1a20] transition-colors"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            <button
              onClick={handleNext}
              disabled={!canAdvance() || saving}
              className="px-7 py-3 rounded-2xl text-white font-bold text-sm shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
            >
              {saving ? 'Saving…' : step < STEPS.length - 1 ? 'Continue →' : mode === 'setup' ? 'Finish setup ✓' : 'Save changes ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
