import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState, createContext, useContext } from "react";
import { 
  Activity, 
  Battery, 
  Signal, 
  Wifi, 
  Moon, 
  Sun, 
  Sparkles,
  Zap,
  Shield,
  Cloud,
  Cpu,
  Database,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Tablet,
  HardDrive,
  Clock,
  Calendar,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Users,
  Network,
  Server,
  GitBranch,
  Boxes,
  Layers,
  Grid,
  List,
  Menu,
  X,
  Settings,
  HelpCircle,
  CreditCard,
  Gift,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Rocket,
  Plane,
  Car,
  Train,
  Bike,
  Footprints,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import appCss from "../styles.css?url";

// ============ ADVANCED CONTEXTS ============

interface SystemStatus {
  online: boolean;
  battery: number;
  memory: number;
  cpu: number;
  network: "slow" | "good" | "excellent";
  uptime: number;
  lastSync: Date;
}

interface NotificationType {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

interface PerformanceMetrics {
  fps: number;
  latency: number;
  renderTime: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

interface RootContextType {
  systemStatus: SystemStatus;
  notifications: NotificationType[];
  addNotification: (notif: Omit<NotificationType, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  performanceMetrics: PerformanceMetrics;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  isTablet: boolean;
  theme: "light" | "dark" | "system" | "ultra-dark";
  setTheme: (theme: "light" | "dark" | "system" | "ultra-dark") => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
}

const RootContext = createContext<RootContextType | null>(null);

export const useRoot = () => {
  const context = useContext(RootContext);
  if (!context) throw new Error("useRoot must be used within RootProvider");
  return context;
};

// ============ CSS ANIMATIONS ============

const animationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }

  .animate-bounce {
    animation: bounce 0.5s ease-in-out;
  }

  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }

  .animate-spin-slow {
    animation: spin 1s linear infinite;
  }

  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .high-contrast {
    --primary: 0 100% 50%;
    --ring: 0 100% 50%;
  }

  .ultra-dark {
    --background: 0 0% 3%;
    --foreground: 0 0% 95%;
    --card: 0 0% 5%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 3%;
    --popover-foreground: 0 0% 95%;
    --primary: 240 100% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 95%;
    --muted: 0 0% 10%;
    --muted-foreground: 0 0% 65%;
    --accent: 240 100% 60%;
    --accent-foreground: 0 0% 100%;
    --border: 0 0% 15%;
  }
`;

// ============ CUSTOM HOOKS ============

function useSystemStatus(): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>({
    online: navigator.onLine,
    battery: 100,
    memory: 0,
    cpu: 0,
    network: "good",
    uptime: 0,
    lastSync: new Date(),
  });

  useEffect(() => {
    const updateOnline = () => setStatus(prev => ({ ...prev, online: navigator.onLine }));
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => setStatus(prev => ({ ...prev, battery: battery.level * 100 }));
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
      });
    }

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateNetwork = () => {
        let network: "slow" | "good" | "excellent" = "good";
        if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") network = "slow";
        else if (connection.effectiveType === "3g") network = "good";
        else network = "excellent";
        setStatus(prev => ({ ...prev, network }));
      };
      updateNetwork();
      connection.addEventListener("change", updateNetwork);
    }

    // Uptime counter
    const startTime = Date.now();
    const interval = setInterval(() => {
      setStatus(prev => ({ ...prev, uptime: Math.floor((Date.now() - startTime) / 1000) }));
    }, 1000);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      clearInterval(interval);
    };
  }, []);

  return status;
}

function usePerformanceMonitor(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    latency: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setMetrics(prev => ({ ...prev, fps: Math.min(fps, 60) }));
        frameCount = 0;
        lastTime = now;
      }
      animationId = requestAnimationFrame(measureFPS);
    };
    animationId = requestAnimationFrame(measureFPS);

    // Monitor long tasks
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              setMetrics(prev => ({ ...prev, renderTime: Math.max(prev.renderTime, entry.duration) }));
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
        return () => {
          cancelAnimationFrame(animationId);
          observer.disconnect();
        };
      } catch (e) {
        console.warn("PerformanceObserver not supported");
      }
    }

    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
}

function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return { isMobile, isTablet };
}

// ============ ADVANCED COMPONENTS ============

function SystemStatusBar() {
  const { systemStatus } = useRoot();
  const [showDetails, setShowDetails] = useState(false);

  const getNetworkIcon = () => {
    switch (systemStatus.network) {
      case "slow": return <Signal className="h-3 w-3 text-yellow-500" />;
      case "good": return <Signal className="h-3 w-3 text-green-500" />;
      case "excellent": return <Wifi className="h-3 w-3 text-emerald-500" />;
      default: return <Wifi className="h-3 w-3" />;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs border border-border shadow-lg cursor-pointer hover:bg-background/90 transition-all"
            onClick={() => setShowDetails(!showDetails)}
          >
            {systemStatus.online ? (
              <>
                {getNetworkIcon()}
                <span className="text-muted-foreground">|</span>
                <Battery className="h-3 w-3" />
                <span>{Math.round(systemStatus.battery)}%</span>
                <span className="text-muted-foreground">|</span>
                <Cpu className="h-3 w-3" />
                <span>{Math.round(systemStatus.cpu)}%</span>
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Offline</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Network</span>
              <span className="capitalize">{systemStatus.network}</span>
            </div>
            <div className="flex justify-between">
              <span>Battery</span>
              <span>{Math.round(systemStatus.battery)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime</span>
              <span>{Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync</span>
              <span>{systemStatus.lastSync.toLocaleTimeString()}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function NotificationCenter() {
  const { notifications, markNotificationRead, clearNotifications } = useRoot();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearNotifications}>
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No notifications
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem key={notif.id} onClick={() => markNotificationRead(notif.id)}>
              <div className="flex gap-3 py-2">
                {getIcon(notif.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notif.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PerformanceMetricsWidget() {
  const { performanceMetrics } = useRoot();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm rounded-lg border border-border shadow-lg transition-all ${expanded ? "w-64 p-3" : "p-1"}`}>
      <Button variant="ghost" size="sm" className="h-6 w-full justify-between text-xs" onClick={() => setExpanded(!expanded)}>
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Performance
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      {expanded && (
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex justify-between">
            <span>FPS</span>
            <span className={performanceMetrics.fps < 30 ? "text-red-500" : "text-green-500"}>
              {performanceMetrics.fps}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Latency</span>
            <span>{performanceMetrics.latency}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Render Time</span>
            <span>{performanceMetrics.renderTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>API Calls</span>
            <span>{performanceMetrics.apiCalls}</span>
          </div>
          <Progress value={(performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses || 1)) * 100} className="h-1" />
          <div className="flex justify-between text-muted-foreground">
            <span>Cache Hit Rate</span>
            <span>{Math.round((performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses || 1)) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickSettingsPanel() {
  const { theme, setTheme, fontSize, setFontSize, reduceMotion, setReduceMotion, highContrast, setHighContrast } = useRoot();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Quick Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Theme</span>
            <div className="flex gap-1">
              {(["light", "dark", "ultra-dark"] as const).map(t => (
                <Button
                  key={t}
                  variant={theme === t ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs capitalize"
                  onClick={() => setTheme(t)}
                >
                  {t === "ultra-dark" ? "Ultra" : t}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Font Size</span>
              <span>{fontSize}px</span>
            </div>
            <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={20} step={1} />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Reduce Motion</span>
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">High Contrast</span>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { addNotification } = useRoot();
  const router = useRouter();

  const actions = [
    { icon: <MessageSquare className="h-4 w-4" />, label: "New Chat", action: () => router.navigate({ to: "/" }) },
    { icon: <RefreshCw className="h-4 w-4" />, label: "Refresh", action: () => window.location.reload() },
    { icon: <Download className="h-4 w-4" />, label: "Export Data", action: () => addNotification({ title: "Export", message: "Data export started", type: "info" }) },
    { icon: <HelpCircle className="h-4 w-4" />, label: "Help", action: () => window.open("https://docs.dksai.com", "_blank") },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-14 right-0 space-y-2 animate-slide-in">
          {actions.map((action, i) => (
            <button
              key={action.label}
              onClick={() => { action.action(); setIsOpen(false); }}
              className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm shadow-lg hover:bg-accent transition-all w-32"
              style={{ animationDelay: `${i * 50}ms`, animation: 'slideInRight 0.2s ease-out forwards' }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
      <Button
        className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className={`h-5 w-5 text-primary-foreground transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </Button>
    </div>
  );
}

function KeyboardShortcutsHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !visible) {
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-xl p-4 max-w-md animate-slide-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setVisible(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between"><span>⌘K</span><span className="text-muted-foreground">Command Palette</span></div>
        <div className="flex justify-between"><span>⌘J</span><span className="text-muted-foreground">New Chat</span></div>
        <div className="flex justify-between"><span>⌘.</span><span className="text-muted-foreground">Focus Mode</span></div>
        <div className="flex justify-between"><span>⌘/</span><span className="text-muted-foreground">Settings</span></div>
        <div className="flex justify-between"><span>⌘⇧D</span><span className="text-muted-foreground">Toggle Dark Mode</span></div>
        <div className="flex justify-between"><span>⌘S</span><span className="text-muted-foreground">Speak Last Message</span></div>
        <div className="flex justify-between"><span>?</span><span className="text-muted-foreground">Show Shortcuts</span></div>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

function NotFoundComponent() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 animate-bounce">404</div>
        <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.navigate({ to: "/" })}>
            Go home
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4 animate-pulse-slow">⚠️</div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => { router.invalidate(); reset(); }}>
            Try again
          </Button>
          <Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f0f0f" },
      { name: "color-scheme", content: "dark light" },
      { title: "dksai — Ultra Advanced AI Chat" },
      { name: "description", content: "dksai — The most advanced AI chat platform with multi-model ensemble, agent workflows, real-time collaboration, and cutting-edge features." },
      { name: "keywords", content: "dksai, AI chat, futuristic AI, GPT-5, Gemini, Claude, image generation, code AI, voice AI, multi-model, ensemble, agent" },
      { name: "robots", content: "index, follow" },
      { name: "googlebot", content: "index, follow" },
      { property: "og:site_name", content: "dksai" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "dksai — Ultra Advanced AI Chat Platform" },
      { property: "og:description", content: "Experience the future of AI conversation with ensemble mode, agent workflows, and real-time collaboration." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/bb0c9c75-68bb-4857-a40f-cd5978c11633" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "dksai — Ultra Advanced AI Chat" },
      { name: "twitter:description", content: "The most advanced AI chat platform ever created." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/bb0c9c75-68bb-4857-a40f-cd5978c11633" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "dksai" },
      { name: "msapplication-TileColor", content: "#0f0f0f" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    ],
    scripts: [
      {
        children: `
          // Inject animation styles
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(animationStyles)};
          document.head.appendChild(style);
          
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
          }
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { reduceMotion, theme } = useRoot() || { reduceMotion: false, theme: "dark" };

  return (
    <html lang="en" className={reduceMotion ? "reduce-motion" : ""}>
      <head>
        <HeadContent />
      </head>
      <body className={theme === "ultra-dark" ? "ultra-dark" : ""}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootProvider({ children }: { children: React.ReactNode }) {
  const systemStatus = useSystemStatus();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const performanceMetrics = usePerformanceMonitor();
  const [performanceMetricsState, setPerformanceMetricsState] = useState<PerformanceMetrics>(performanceMetrics);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isMobile, isTablet } = useResponsive();
  const [theme, setTheme] = useState<"light" | "dark" | "system" | "ultra-dark">("dark");
  const [fontSize, setFontSize] = useState(15);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [downloadIcon] = useState(<Download className="h-4 w-4" />);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dksai.theme") as typeof theme;
    if (savedTheme) setTheme(savedTheme);
    const savedFontSize = localStorage.getItem("dksai.fontSize");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    const savedReduceMotion = localStorage.getItem("dksai.reduceMotion");
    if (savedReduceMotion) setReduceMotion(savedReduceMotion === "true");
    const savedHighContrast = localStorage.getItem("dksai.highContrast");
    if (savedHighContrast) setHighContrast(savedHighContrast === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("dksai.theme", theme);
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("ultra-dark", theme === "ultra-dark");
    document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`);
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [theme, fontSize, reduceMotion, highContrast]);

  useEffect(() => {
    setPerformanceMetricsState(prev => ({ ...prev, ...performanceMetrics }));
  }, [performanceMetrics]);

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  const addNotification = (notif: Omit<NotificationType, "id" | "timestamp" | "read">) => {
    const newNotif: NotificationType = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updatePerformanceMetrics = (metrics: Partial<PerformanceMetrics>) => {
    setPerformanceMetricsState(prev => ({ ...prev, ...metrics }));
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <RootContext.Provider value={{
      systemStatus,
      notifications,
      addNotification,
      markNotificationRead,
      clearNotifications,
      performanceMetrics: performanceMetricsState,
      updatePerformanceMetrics,
      isSidebarOpen,
      toggleSidebar,
      isMobile,
      isTablet,
      theme,
      setTheme,
      fontSize,
      setFontSize,
      reduceMotion,
      setReduceMotion,
      highContrast,
      setHighContrast,
    }}>
      {children}
    </RootContext.Provider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RootProvider>
        <TooltipProvider>
          <Outlet />
          <SystemStatusBar />
          <PerformanceMetricsWidget />
          <FloatingActionButton />
          <KeyboardShortcutsHint />
          <Toaster richColors position="top-center" theme="dark" closeButton />
        </TooltipProvider>
      </RootProvider>
    </QueryClientProvider>
  );
}
