"use client"

import { motion } from "framer-motion"
import { Home, Layout, FileText, Settings, Users, Sparkles } from "lucide-react"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-4 w-4" />,
    label: "Home",
    href: "/",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <Layout className="h-4 w-4" />,
    label: "Dashboard",
    href: "/dashboard",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.06) 50%, rgba(99,102,241,0) 100%)",
    iconColor: "text-violet-500",
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: "Templates",
    href: "/templates",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: "AI Studio",
    href: "/editor/new",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Settings className="h-4 w-4" />,
    label: "Settings",
    href: "/settings",
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
    iconColor: "text-pink-500",
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "Workspaces",
    href: "/workspaces",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itemVariants: any = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const backVariants: any = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const glowVariants: any = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navGlowVariants: any = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharedTransition: any = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export function GlowMenuBar({ className }: { className?: string }) {
  return (
    <motion.nav
      className={`p-1.5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden ${className || ''}`}
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className="absolute -inset-2 bg-gradient-radial from-transparent via-blue-400/20 via-purple-400/20 via-red-400/20 to-transparent rounded-3xl z-0 pointer-events-none"
        variants={navGlowVariants}
      />
      <ul className="flex items-center gap-1 relative z-10">
        {menuItems.map((item) => (
          <motion.li key={item.label} className="relative">
            <motion.div
              className="block rounded-xl overflow-visible group relative"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                variants={glowVariants}
                style={{
                  background: item.gradient,
                  opacity: 0,
                  borderRadius: "16px",
                }}
              />
              <motion.a
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 relative z-10 text-gray-400 group-hover:text-white transition-colors rounded-xl"
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                <span className={`transition-colors duration-300 ${item.iconColor}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </motion.a>
              <motion.a
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 absolute inset-0 z-10 text-gray-400 group-hover:text-white transition-colors rounded-xl"
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                <span className={`transition-colors duration-300 ${item.iconColor}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              </motion.a>
            </motion.div>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}
