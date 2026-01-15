import { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies)
            .filter(([_, value]) => typeof value === 'string')
            .map(([name, value]) => ({
              name,
              value: value as string,
            }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              path: '/',
              httpOnly: true,
              // secure: process.env.NODE_ENV === 'production',
              // sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'None',
              secure: true,
              sameSite:'Lax',
              maxAge: 60 * 60,
              ...options,
            }

            res.setHeader('Set-Cookie', serialize(name, value, cookieOptions))
          })
        },
      },
    }
  )

  await supabase.auth.setSession(req.body)

  return res.status(200).json({ ok: true })
}
