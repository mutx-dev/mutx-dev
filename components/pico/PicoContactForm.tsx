'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import * as Select from '@radix-ui/react-select'
import { X, ArrowRight, Check, ChevronDown } from 'lucide-react'

import s from './PicoContactForm.module.css'

type PicoContactFormProps = {
  open: boolean
  onClose: () => void
  defaultInterest?: string
  defaultMessage?: string
  source?: string
  onSuccess?: () => void
}

export function PicoContactForm({
  open,
  onClose,
  defaultInterest,
  defaultMessage,
  source = 'pico-landing',
  onSuccess,
}: PicoContactFormProps) {
  const t = useTranslations('pico.contactForm')
  const locale = useLocale()
  const prefersReducedMotion = useReducedMotion()
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [interest, setInterest] = useState(defaultInterest || 'building-first')
  const honeypotRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setInterest(defaultInterest || 'building-first')
    }
  }, [defaultInterest, open])

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (state === 'submitting') return

      if (honeypotRef.current?.value) return

      setState('submitting')
      setErrorMsg('')

      const form = new FormData(e.currentTarget)
      const payload = {
        email: form.get('email') as string,
        name: form.get('name') as string,
        company: form.get('company') as string,
        message: form.get('message') as string,
        interest,
        locale,
        source,
        honeypot: honeypotRef.current?.value || '',
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          const msg = data.error?.message || t('errorFallback')
          setErrorMsg(msg)
          setState('error')
          return
        }

        setState('success')
        onSuccess?.()
      } catch {
        setErrorMsg(t('networkError'))
        setState('error')
      }
    },
    [state, interest, locale, onSuccess, source, t],
  )

  const handleClose = useCallback(() => {
    if (state === 'submitting') return
    setState('idle')
    setErrorMsg('')
    onClose()
  }, [state, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.overlay}
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            className={s.modal}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={t('dialogLabel')}
          >
            <button
              className={s.closeBtn}
              onClick={handleClose}
              aria-label={t('closeLabel')}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            {state === 'success' ? (
              <div className={s.successState}>
                <span className={s.successIcon}>
                  <Check className="h-6 w-6" />
                </span>
                <h2 className={s.successTitle}>{t('successTitle')}</h2>
                <p className={s.successBody}>{t('successBody')}</p>
                <button className={s.successBtn} onClick={handleClose} type="button">
                  {t('successBack')}
                </button>
              </div>
            ) : (
              <>
                <div className={s.header}>
                  <h2 className={s.title}>{t('title')}</h2>
                  <p className={s.subtitle}>{t('subtitle')}</p>
                </div>

                <form className={s.form} onSubmit={handleSubmit}>
                  <input
                    ref={honeypotRef}
                    name="website"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className={s.honeypot}
                  />

                  <div className={s.row}>
                    <label className={s.label} htmlFor="pico-email">
                      <span className={s.labelText}>{t('emailLabel')}</span>
                      <input
                        id="pico-email"
                        name="email"
                        type="email"
                        required
                        placeholder={t('emailPlaceholder')}
                        className={s.input}
                        autoComplete="email"
                      />
                    </label>
                  </div>

                  <div className={s.row2}>
                    <label className={s.label} htmlFor="pico-name">
                      <span className={s.labelText}>{t('nameLabel')}</span>
                      <input
                        id="pico-name"
                        name="name"
                        type="text"
                        placeholder={t('namePlaceholder')}
                        className={s.input}
                        autoComplete="name"
                      />
                    </label>
                    <label className={s.label} htmlFor="pico-company">
                      <span className={s.labelText}>{t('companyLabel')}</span>
                      <input
                        id="pico-company"
                        name="company"
                        type="text"
                        placeholder={t('companyPlaceholder')}
                        className={s.input}
                        autoComplete="organization"
                      />
                    </label>
                  </div>

                  <div className={s.label}>
                    <span className={s.labelText}>{t('interestLabel')}</span>
                    <Select.Root value={interest} onValueChange={setInterest}>
                      <Select.Trigger className={s.selectTrigger}>
                        <Select.Value />
                        <Select.Icon className={s.selectIcon}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className={s.selectContent}
                          position="popper"
                          sideOffset={4}
                          align="start"
                        >
                          <Select.ScrollUpButton className={s.selectScroll} />
                          <Select.Viewport className={s.selectViewport}>
                            <Select.Item value="building-first" className={s.selectItem}>
                              <Select.ItemText>{t('interestOptions.building-first')}</Select.ItemText>
                              <Select.ItemIndicator className={s.selectIndicator}>
                                <Check className="h-3 w-3" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="fixing-existing" className={s.selectItem}>
                              <Select.ItemText>{t('interestOptions.fixing-existing')}</Select.ItemText>
                              <Select.ItemIndicator className={s.selectIndicator}>
                                <Check className="h-3 w-3" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="evaluating" className={s.selectItem}>
                              <Select.ItemText>{t('interestOptions.evaluating')}</Select.ItemText>
                              <Select.ItemIndicator className={s.selectIndicator}>
                                <Check className="h-3 w-3" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="spent-money" className={s.selectItem}>
                              <Select.ItemText>{t('interestOptions.spent-money')}</Select.ItemText>
                              <Select.ItemIndicator className={s.selectIndicator}>
                                <Check className="h-3 w-3" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="other" className={s.selectItem}>
                              <Select.ItemText>{t('interestOptions.other')}</Select.ItemText>
                              <Select.ItemIndicator className={s.selectIndicator}>
                                <Check className="h-3 w-3" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          </Select.Viewport>
                          <Select.ScrollDownButton className={s.selectScroll} />
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <label className={s.label} htmlFor="pico-message">
                    <span className={s.labelText}>
                      {t('messageLabel')} <span className={s.optional}>{t('messageOptional')}</span>
                    </span>
                    <textarea
                      id="pico-message"
                      name="message"
                      rows={3}
                      defaultValue={defaultMessage}
                      placeholder={t('messagePlaceholder')}
                      className={s.textarea}
                    />
                  </label>

                  {errorMsg && <p className={s.error}>{errorMsg}</p>}

                  <button
                    type="submit"
                    className={s.submit}
                    disabled={state === 'submitting'}
                  >
                    {state === 'submitting' ? (
                      t('submitting')
                    ) : (
                      <>
                        {t('submit')}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className={s.disclaimer}>{t('disclaimer')}</p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
