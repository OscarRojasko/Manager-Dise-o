import * as React from "react"
import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  Menu,
  Briefcase,
  Layers,
  Wrench,
  Search,
  Bell,
  Sun,
  Moon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  
  const navItems = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Inventario", href: "/inventario", icon: Package },
    { title: "Ventas & CRM", href: "/ventas", icon: Users },
    { title: "Producción", href: "/produccion", icon: Wrench },
    { title: "Usuarios", href: "/usuarios", icon: Settings },
  ]

  // Get current module title
  const currentNav = navItems.find(item => {
    if (item.href === '/') return location === '/'
    return location.startsWith(item.href)
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
            <Layers className="h-5 w-5" />
            <span>SIGOS</span>
          </div>
          <span className="ml-2 text-xs font-mono text-sidebar-foreground/60 border-l border-sidebar-border pl-2">
            Sublicolor C.A.
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Módulos
            </p>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-medium text-xs">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Admin Usuario</span>
              <span className="text-xs text-sidebar-foreground/60 mt-1">admin@sublicolor.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              {currentNav?.title || 'SIGOS'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar SKU, Cliente, Pedido..."
                className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-card" />
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
