'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    async function logout() {
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        router.push('/')
        router.refresh()
      }
    }

    logout()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white/60">Logging out...</div>
    </div>
  )
}
