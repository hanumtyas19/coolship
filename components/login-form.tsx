"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  auth,
  provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  firestore,
  doc,
  getDoc,
} from "@/lib/firebase"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [googleLoginDisabled, setGoogleLoginDisabled] = useState(false)

  useEffect(() => {
    setIsFormValid(email.trim() !== "" && password.trim() !== "")
  }, [email, password])

  const validateAdminAccess = async (uid: string) => {
    const adminRef = doc(firestore, "admins", uid)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists() && adminSnap.data().role === "admin"
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setGoogleLoginDisabled(true)
    setError("")
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user

      const isAdmin = await validateAdminAccess(user.uid)

      if (isAdmin) {
        toast.success("Login successful", {
          description: "You have successfully logged in."
        })
        router.push("/dashboard")
      } else {
        await deleteUser(user)
        await signOut(auth)
        setError("This account is not allowed to access the system.")
        toast.error("Access Denied", {
          description: "This account is not allowed to access the system."
        })
      }
    } catch (err: any) {
      const errorMessage = err.message || "Login failed."
      setError(errorMessage)
      toast.error("Login Failed", {
        description: "This email does not have access."
      })
    } finally {
      setLoading(false)
      setGoogleLoginDisabled(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const isAdmin = await validateAdminAccess(user.uid)

      if (isAdmin) {
        toast.success("Login successful", {
          description: "You have successfully logged in."
        })
        router.push("/dashboard")
      } else {
        await deleteUser(user)
        await signOut(auth)
        setError("This account is not allowed to access the system.")
        toast.error("Access Denied", {
          description: "This account is not allowed to access the system."
        })
      }
    } catch (err: any) {
      const errorMessage = err.message || "Login failed."
      setError(errorMessage)
      toast.error("Login Failed", {
        description: "This email does not have access."
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleEmailPasswordLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Welcome back</h1>
                <p className="text-muted-foreground text-balance mt-2">
                  Login to your CoolShip account
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-md"
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="font-medium">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline transition-colors"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300" 
                disabled={loading || !isFormValid}
              >
                {loading ? "Checking..." : "Login"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="w-full">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11 rounded-md gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoginDisabled}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{loading ? "Signing in..." : "Login with Google"}</span>
                </Button>
              </div>
            </div>
          </form>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-white max-w-md">
                <h2 className="text-3xl font-bold mb-4">Smart Frozen Food Management</h2>
                <p className="opacity-90">Manage your frozen food inventory efficiently with our advanced dashboard and analytics.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
