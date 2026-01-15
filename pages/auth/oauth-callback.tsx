import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/utils/supabase/components'

export default function OAuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const supabase = createClient()

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        router.replace('/auth/login')
      } else {
        router.replace('/')
      }
    })
  }, [router])
  
  // useEffect(() => {
  //   if (!router.isReady) return;

  //   const supabase = createClient();

  //   supabase.auth.getSession().then(async ({ data, error }) => {
  //     if (error || !data?.session) {
  //       router.replace('/auth/login');
  //       return;
  //     }

  //     try {
  //       await fetch('/api/supabase/set-server-session', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(data.session),
  //       });
  //     } catch (err) {
  //       console.error('Erreur lors de la synchronisation de la session :', err);
  //     }

  //     router.replace('/');
  //   });
  // }, [router.isReady]);


  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <img
      src="/favicon.ico"
      alt="Logo"
      style={{ width: 64, height: 64, marginBottom: 32 }}
    />
    <div style={{ color: "#fff", fontSize: 24, letterSpacing: 2, fontWeight: "bold", textAlign: "center" }}>
      AUTHENTIFICATION
      <span className="dot-anim" style={{ display: "inline-block", marginLeft: 8 }}></span>
    </div>
    <style jsx>{`
      .dot-anim:after {
        content: '';
        display: inline-block;
        width: 1em;
        text-align: left;
        animation: dots 1.2s steps(3, end) infinite;
      }
      @keyframes dots {
        0%, 20% {
          content: '';
        }
        40% {
          content: '.';
        }
        60% {
          content: '..';
        }
        80%, 100% {
          content: '...';
        }
      }
    `}</style>
  </div>
)
}
