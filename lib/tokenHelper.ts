// lib/tokenHelper.ts
import { auth } from './firebase'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

export async function setAuthToken() {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    Cookies.set('token', token, { expires: 1 }) // expires in 1 day
  }
}

// This function can be used inside a React component or hook
export function logout() {
  const router = useRouter()
  return () => {
    Cookies.remove('token')
    router.push('/login')
  }
}
