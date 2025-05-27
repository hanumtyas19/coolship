"use client"

import * as React from "react"
import {
  IconLayoutDashboardFilled,
  IconHistoryToggle,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"

// Helper function to get initials from name
function getInitials(name: string) {
  if (!name) return ""
  const words = name.trim().split(" ")
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() || ""
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Helper function to generate a background color based on the name
function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = "#"
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += ("00" + value.toString(16)).slice(-2)
  }
  return color
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<User | null>(null)
  const [userInfo, setUserInfo] = React.useState<{
    name: string
    email: string
    avatar: string
  }>({
    name: "",
    email: "",
    avatar: "",
  })

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const name =
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "User"
        // Jika tidak ada photoURL, avatar diisi dengan data:image/svg+xml berisi inisial
        let avatar = firebaseUser.photoURL || ""
        if (!avatar) {
          const initials = getInitials(name)
          const bgColor = stringToColor(name)
          // SVG avatar dengan inisial
          const svg = encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <rect width="100%" height="100%" fill="${bgColor}" rx="12"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-family="Arial" font-size="28" fill="#fff">${initials}</text>
            </svg>`
          )
          avatar = `data:image/svg+xml,${svg}`
        }
        setUserInfo({
          name,
          email: firebaseUser.email || "",
          avatar,
        })
      } else {
        setUserInfo({
          name: "",
          email: "",
          avatar: "",
        })
      }
    })
    return () => unsubscribe()
  }, [])

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboardFilled,
    },
    {
      title: "History",
      url: "/dashboard/history",
      icon: IconHistoryToggle,
    },

  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <img src="logoText.png" alt="CoolShip Logo" className="h-8" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} />
      </SidebarFooter>
    </Sidebar>
  )
}
