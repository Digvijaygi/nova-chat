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
  Shield, 
  Zap, 
  Cpu, 
  Globe, 
  Lock, 
  Bell, 
  BellOff,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  Battery,
  BatteryCharging,
  Signal,
  Cloud,
  CloudOff,
  Database,
  HardDrive,
  Clock,
  Calendar,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Settings,
  HelpCircle,
  MessageSquare,
  Users,
  Sparkles,
  Crown,
  Gem,
  Rocket,
  Flame,
  Wind,
  Droplets,
  Star,
  Heart,
  Award,
  Medal,
  Trophy,
} from "lucide-react";

import appCss from "../styles.css?url";

// Advanced Context for global state
interface GlobalAppState {
  theme: "dark" | "light" | "system" | "ultra-dark";
  setTheme: (theme: "dark" | "light" | "system" | "ultra-dark") => void;
  animations: boolean;
  setAnimations: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (enabled: boolean) => void;
  performanceMode: "balanced" | "performance" | "battery-saver";
  setPerformanceMode: (mode: "balanced" | "performance" | "battery-saver") => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  voiceCommands: boolean;
  setVoiceCommands: (enabled: boolean) => void;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  compression: boolean;
  setCompression: (enabled: boolean) => void;
  cacheSize: number;
  setCacheSize: (size: number) => void;
  lastSyncTime: Date | null;
  setLastSyncTime: (time: Date) => void;
  isOnline: boolean;
  batteryLevel: number | null;
  isCharging: boolean;
  networkType: string | null;
  connectionSpeed: string | null;
}

const GlobalAppContext = createContext<GlobalAppState | undefined>(undefined);

export const useGlobalApp = () => {
  const context = useContext(GlobalAppContext);
  if (!context) throw new Error("useGlobalApp must be used within GlobalAppProvider");
  return context;
};

// Custom hook for localStorage with validation
function useAdvancedLS<T>(key: string, initial: T, validator?: (value: unknown) => boolean): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dksai.${key}`);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (validator ? validator(parsed) : true) {
          setV(parsed as T);
        }
      }
    } catch { /* ignore */ }
  }, [key, validator]);
  const set = (next: T) => {
    setV(next);
    try { localStorage.setItem(`dksai.${key}`, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return [v, set];
}

// Performance monitoring hook
function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    renderTime: 0,
    networkLatency: 0,
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

    // Memory measurement
    if ('memory' in performance) {
      const interval = setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          setMetrics(prev => ({ ...prev, memory: Math.round(memory.usedJSHeapSize / 1048576) }));
        }
      }, 5000);
      return () => clearInterval(interval);
    }

    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
}

// Network status hook with detailed info
function useNetworkStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    type: 'unknown',
    speed: 'unknown',
    effectiveType: 'unknown',
    rtt: 0,
    downlink: 0,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setStatus(prev => ({
          ...prev,
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          rtt: connection.rtt || 0,
          downlink: connection.downlink || 0,
          speed: connection.downlink ? `${connection.downlink} Mbps` : 'unknown',
        }));
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) connection.removeEventListener('change', updateConnectionInfo);
    };
  }, []);

  return status;
}

// Battery status hook
function useBatteryStatus() {
  const [battery, setBattery] = useState<{ level: number | null; charging: boolean }>({ level: null, charging: false });

  useEffect(() => {
    const getBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const batteryManager = await (navigator as any).getBattery();
          const updateBattery = () => {
            setBattery({
              level: batteryManager.level * 100,
              charging: batteryManager.charging,
            });
          };
          updateBattery();
          batteryManager.addEventListener('levelchange', updateBattery);
          batteryManager.addEventListener('chargingchange', updateBattery);
          return () => {
            batteryManager.removeEventListener('levelchange', updateBattery);
            batteryManager.removeEventListener('chargingchange', updateBattery);
          };
        } catch { /* ignore */ }
      }
    };
    getBattery();
  }, []);

  return battery;
}

// Floating performance dashboard component
function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useAdvancedLS('perfDashboard', false);
  const [isMinimized, setIsMinimized] = useState(false);
  const metrics = usePerformanceMonitor();
  const network = useNetworkStatus();
  const battery = useBatteryStatus();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Performance Dashboard</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            className="hover:bg-background/50 rounded p-0.5"
          >
            <Minimize2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">FPS:</span>
            <span className={`font-mono ${metrics.fps > 50 ? 'text-green-500' : metrics.fps > 30 ? 'text-yellow-500' : 'text-red-500'}`}>
              {metrics.fps}
            </span>
          </div>
          {metrics.memory > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory:</span>
              <span className="font-mono">{metrics.memory} MB</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <div className="flex items-center gap-1">
              {network.isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
              <span className="font-mono">{network.speed}</span>
            </div>
          </div>
          {battery.level !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battery:</span>
              <div className="flex items-center gap-1">
                {battery.charging ? <BatteryCharging className="h-3 w-3 text-green-500" /> : <Battery className="h-3 w-3" />}
                <span className="font-mono">{Math.round(battery.level)}%</span>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connection:</span>
            <span className="font-mono capitalize">{network.effectiveType}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Global keyboard shortcut handler
function GlobalKeyboardHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setTheme, setPerformanceMode, setAnimations } = useGlobalApp();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Theme shortcuts
      if (meta && shift && e.key === 'D') {
        e.preventDefault();
        setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'ultra-dark' : 'dark');
      }
      if (meta && alt && e.key === 'T') {
        e.preventDefault();
        setTheme('system');
      }

      // Performance shortcuts
      if (meta && shift && e.key === 'P') {
        e.preventDefault();
        setPerformanceMode(prev => prev === 'balanced' ? 'performance' : prev === 'performance' ? 'battery-saver' : 'balanced');
      }

      // Animation shortcuts
      if (meta && alt && e.key === 'A') {
        e.preventDefault();
        setAnimations(prev => !prev);
      }

      // Help shortcut
      if (e.key === 'F1') {
        e.preventDefault();
        window.open('https://docs.dksai.com', '_blank');
      }

      // Reload shortcut with cache clear
      if (meta && shift && e.key === 'R') {
        e.preventDefault();
        if (confirm('Clear cache and reload?')) {
          localStorage.clear();
          window.location.reload();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setTheme, setPerformanceMode, setAnimations]);

  return <>{children}</>;
}

// Service Worker registration for offline support
function ServiceWorkerRegister() {
  const { offlineMode } = useGlobalApp();

  useEffect(() => {
    if ('serviceWorker' in navigator && offlineMode) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }
  }, [offlineMode]);

  return null;
}

// Offline indicator component
function OfflineIndicator() {
  const { isOnline, offlineMode } = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!offlineMode || isOnline || !show) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-in slide-in-from-top-2">
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Using cached data.</span>
    </div>
  );
}

// Enhanced scroll to top button
function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-40 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-all duration-300 animate-in fade-in"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

function NotFoundComponent() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="max-w-md text-center">
        <div className="relative">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">404</h1>
          <div className="absolute -top-4 -right-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved to a new dimension.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
          >
            <Rocket className="h-4 w-4" />
            Go home
          </Link>
          <button
            onClick={() => router.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:scale-105"
          >
            Go back
          </button>
        </div>
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Need help? <a href="https://docs.dksai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Visit documentation</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-red-500/5 px-4">
      <div className="max-w-md text-center">
        <div className="relative">
          <h1 className="text-8xl font-bold text-red-500">!</h1>
          <div className="absolute -top-4 -right-4 animate-bounce">
            <Flame className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:scale-105"
          >
            Go home
          </a>
        </div>
        <details className="mt-8 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">Technical details</summary>
          <pre className="mt-2 text-xs text-red-400 bg-red-950/50 p-2 rounded overflow-auto">
            {error.stack}
          </pre>
        </details>
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
      { title: "dksai — Next Gen AI Chat Platform" },
      { name: "description", content: "dksai — Ultra-modern AI chat with real-time collaboration, live web search, citations, voice, coding mode, image generation, multi-model switching and advanced features." },
      { name: "keywords", content: "dksai, AI chat, futuristic AI, GPT-5, Gemini, Claude, image generation, code AI, voice AI, multi-model, real-time collaboration" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "Digvijay (DKSNEXT)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "msapplication-TileColor", content: "#0f0f0f" },
      { property: "og:site_name", content: "dksai" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "dksai — Next Gen AI Chat Platform" },
      { name: "twitter:title", content: "dksai — Next Gen AI Chat" },
      { property: "og:description", content: "Experience the future of AI conversation with real-time collaboration and advanced features." },
      { name: "twitter:description", content: "Experience the future of AI conversation." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/bb0c9c75-68bb-4857-a40f-cd5978c11633" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/bb0c9c75-68bb-4857-a40f-cd5978c11633" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "dksai",
          applicationCategory: "Chatbot",
          operatingSystem: "Web",
          description: "Next generation AI chatbot with real-time collaboration, multi-model support, and advanced features.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: { "@type": "Person", name: "Digvijay (DKSNEXT)" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { theme } = useGlobalApp();
  
  return (
    <html lang="en" className={theme === 'ultra-dark' ? 'ultra-dark' : theme === 'dark' ? 'dark' : ''}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  
  // Global state management
  const [theme, setTheme] = useAdvancedLS<"dark" | "light" | "system" | "ultra-dark">("theme", "dark");
  const [animations, setAnimations] = useAdvancedLS<boolean>("animations", true);
  const [reducedMotion, setReducedMotion] = useAdvancedLS<boolean>("reducedMotion", false);
  const [highContrast, setHighContrast] = useAdvancedLS<boolean>("highContrast", false);
  const [offlineMode, setOfflineMode] = useAdvancedLS<boolean>("offlineMode", true);
  const [performanceMode, setPerformanceMode] = useAdvancedLS<"balanced" | "performance" | "battery-saver">("performanceMode", "balanced");
  const [notifications, setNotifications] = useAdvancedLS<boolean>("notifications", true);
  const [soundEnabled, setSoundEnabled] = useAdvancedLS<boolean>("soundEnabled", true);
  const [voiceCommands, setVoiceCommands] = useAdvancedLS<boolean>("voiceCommands", false);
  const [autoSave, setAutoSave] = useAdvancedLS<boolean>("autoSave", true);
  const [compression, setCompression] = useAdvancedLS<boolean>("compression", true);
  const [cacheSize, setCacheSize] = useAdvancedLS<number>("cacheSize", 100);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const networkStatus = useNetworkStatus();
  const batteryStatus = useBatteryStatus();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'system') {
      if (systemDark) {
        root.classList.add('dark');
        root.classList.remove('ultra-dark');
      } else {
        root.classList.remove('dark', 'ultra-dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('ultra-dark');
    } else if (theme === 'ultra-dark') {
      root.classList.add('dark', 'ultra-dark');
    } else {
      root.classList.remove('dark', 'ultra-dark');
    }
  }, [theme]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // Apply high contrast
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Performance mode effects
  useEffect(() => {
    if (performanceMode === 'battery-saver') {
      setAnimations(false);
      setReducedMotion(true);
    } else if (performanceMode === 'performance') {
      setAnimations(true);
      setReducedMotion(false);
    }
  }, [performanceMode, setAnimations, setReducedMotion]);

  // Notification permission request
  useEffect(() => {
    if (notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  const globalState: GlobalAppState = {
    theme, setTheme,
    animations, setAnimations,
    reducedMotion, setReducedMotion,
    highContrast, setHighContrast,
    offlineMode, setOfflineMode,
    performanceMode, setPerformanceMode,
    notifications, setNotifications,
    soundEnabled, setSoundEnabled,
    voiceCommands, setVoiceCommands,
    autoSave, setAutoSave,
    compression, setCompression,
    cacheSize, setCacheSize,
    lastSyncTime, setLastSyncTime,
    isOnline,
    batteryLevel: batteryStatus.level,
    isCharging: batteryStatus.charging,
    networkType: networkStatus.type,
    connectionSpeed: networkStatus.speed,
  };

  return (
    <GlobalAppContext.Provider value={globalState}>
      <QueryClientProvider client={queryClient}>
        <GlobalKeyboardHandler>
          <ServiceWorkerRegister />
          <Outlet />
          <Toaster 
            richColors 
            position="top-center" 
            theme={theme === 'dark' || theme === 'ultra-dark' ? 'dark' : 'light'}
            closeButton
            duration={4000}
          />
          <PerformanceDashboard />
          <ScrollToTop />
          <OfflineIndicator />
        </GlobalKeyboardHandler>
      </QueryClientProvider>
    </GlobalAppContext.Provider>
  );
}

// Add missing imports
import { RefreshCw } from "lucide-react";
