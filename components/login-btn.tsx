"use client"
import { Button } from './ui/button'
import { createClient } from '@/lib/supabase/client'

const LoginBtn = () => {
    const supabase = createClient()
  return (
    <Button onClick={async () => await supabase.auth.signInWithOAuth({
        provider: 'google',
        options:{
          redirectTo: `/auth/onboarding`,
        }
      })}>
        Sign in
      </Button>
  )
}

export default LoginBtn