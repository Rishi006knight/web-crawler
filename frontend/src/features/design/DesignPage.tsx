import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Input,
  StatusChip,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ProgressBar,
  Skeleton,
  Tabs,
  TabsList,
  TabTrigger,
  TabContent,
  Sheet,
  useToast,
} from '../../ui';
import {
  Play,
  Download,
  Search,
  Check,
  AlertTriangle,
  Moon,
  Sun,
  Laptop,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export function DesignPage({ onBack }: { onBack: () => void }) {
  const { theme, setTheme, isDark } = useTheme();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-3">
            <IconButton
              variant="outline"
              size="sm"
              onClick={onBack}
              aria-label="Back to crawler application"
            >
              <ArrowLeft className="w-4 h-4" />
            </IconButton>
            <h1 className="text-2xl font-bold text-ink-strong tracking-tight">
              Design System & Token Catalog
            </h1>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Precision tokens, accessible contrast verified palettes (WCAG AA &ge; 4.5:1), and reusable UI primitives.
          </p>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-2 bg-surface-sunken p-1 border border-line rounded-lg">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              theme === 'light'
                ? 'bg-surface-raised text-ink-strong shadow-hairline border border-line'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              theme === 'dark'
                ? 'bg-surface-raised text-ink-strong shadow-hairline border border-line'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-brand" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              theme === 'system'
                ? 'bg-surface-raised text-ink-strong shadow-hairline border border-line'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-ink-muted" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="components" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabTrigger value="components">UI Components</TabTrigger>
          <TabTrigger value="tokens">Color Tokens & Contrast</TabTrigger>
          <TabTrigger value="feedback">Interactive Feedback</TabTrigger>
        </TabsList>

        {/* Tab 1: Components */}
        <TabContent value="components" className="space-y-10">
          {/* Buttons Matrix */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Buttons & Interactive Controls</CardTitle>
                <CardDescription>
                  Supports primary, secondary, outline, ghost, and danger variants across sm, md, and lg sizes.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Play className="w-4 h-4" />}>
                  Primary Action
                </Button>
                <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Secondary Action
                </Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Action</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Small (32px)
                </Button>
                <Button variant="primary" size="md">
                  Medium (38px)
                </Button>
                <Button variant="primary" size="lg">
                  Large (44px)
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                  Icon Buttons:
                </span>
                <IconButton variant="outline" size="sm" aria-label="Search items">
                  <Search className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton variant="secondary" size="md" aria-label="Run inspection">
                  <Play className="w-4 h-4 text-brand" />
                </IconButton>
                <IconButton variant="primary" size="lg" aria-label="Sparkle action">
                  <Sparkles className="w-5 h-5" />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Status Chips */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Status Chips & Badges</CardTitle>
                <CardDescription>
                  Tinted 8% backgrounds with 30% borders and WCAG AA contrast compliance.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip variant="default" dot>
                  Default (Brand)
                </StatusChip>
                <StatusChip variant="success" dot>
                  HTTP 200 OK
                </StatusChip>
                <StatusChip variant="warning" dot>
                  HTTP 301 Redirect
                </StatusChip>
                <StatusChip variant="danger" dot>
                  HTTP 404 / 500 Error
                </StatusChip>
                <StatusChip variant="info" dot>
                  Discovered URL
                </StatusChip>
                <StatusChip variant="blocked" dot>
                  Robots Blocked
                </StatusChip>
                <StatusChip variant="neutral">Neutral Tag</StatusChip>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Input Fields & States</CardTitle>
                <CardDescription>
                  Inputs with floating helper text, dynamic icons, and accessible aria-invalid error boundaries.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input
                  label="Target Website URL"
                  placeholder="https://example.com"
                  leftIcon={<Search className="w-4 h-4" />}
                  helperText="Enter a fully qualified URL to begin."
                />
                <Input
                  label="Max Crawl Depth"
                  type="number"
                  defaultValue={2}
                  helperText="Default 2, limits BFS branch exploration."
                />
                <Input
                  label="Invalid SSRF Target"
                  defaultValue="http://169.254.169.254"
                  error="Target blocked: Private or metadata address rejected by SSRF guard."
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress & Skeletons */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Progress Indicators & Loading States</CardTitle>
                <CardDescription>
                  Accessible multi-segmented crawl progress bars and content loading placeholders.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-ink">Multi-Segmented Crawl Status</span>
                  <span className="text-ink-secondary">65/100 URLs Processed (65%)</span>
                </div>
                <ProgressBar
                  value={65}
                  max={100}
                  segments={{ fetched: 45, skipped: 15, failed: 5, total: 100 }}
                />
                <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" /> Fetched (45)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-warning" /> Skipped (15)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-danger" /> Failed (5)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-ink-muted mb-2 font-medium">
                  Shimmer Skeleton Loaders (Adapts to light & dark mode)
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* Tab 2: Tokens & Contrast */}
        <TabContent value="tokens" className="space-y-8">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Semantic Token Scale</CardTitle>
                <CardDescription>
                  All colors are verified against the surface background for WCAG AA compliance.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="text-xs font-semibold text-ink-muted uppercase">Canvas Surface</div>
                  <div className="text-sm font-bold text-ink-strong">--canvas / --surface</div>
                  <div className="text-xs text-ink-secondary">Light: #FFFFFF / #F8FAFC</div>
                  <div className="text-xs text-ink-secondary">Dark: #020617 / #0F172A</div>
                </div>

                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="text-xs font-semibold text-ink-muted uppercase">Brand Accent</div>
                  <div className="text-sm font-bold text-brand">--accent (#0369A1)</div>
                  <div className="text-xs text-ink-secondary">Light: 5.93:1 on White (AA Pass)</div>
                  <div className="text-xs text-ink-secondary">Replaces low-contrast #0284C7</div>
                </div>

                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="text-xs font-semibold text-ink-muted uppercase">Body Text</div>
                  <div className="text-sm font-bold text-ink">--text-body (#334155)</div>
                  <div className="text-xs text-ink-secondary">Light: 10.35:1 on White (AAA Pass)</div>
                  <div className="text-xs text-ink-secondary">Dark: #CBD5E1</div>
                </div>

                <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
                  <div className="text-xs font-semibold text-ink-muted uppercase">Text Floor (Muted)</div>
                  <div className="text-sm font-bold text-ink-muted">--text-muted (#64748B)</div>
                  <div className="text-xs text-ink-secondary">Light: 4.76:1 on White (AA Pass)</div>
                  <div className="text-xs text-ink-secondary">Strictly avoids failing #94A3B8</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* Tab 3: Interactive Feedback */}
        <TabContent value="feedback" className="space-y-8">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Modals, Sheets, and Notification Toasts</CardTitle>
                <CardDescription>
                  Full keyboard trap, Escape key handling, and mobile bottom sheet transitions.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => setIsSheetOpen(true)}
                  leftIcon={<Layers className="w-4 h-4" />}
                >
                  Open Responsive Inspector Sheet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast('Crawl session started successfully for https://news.ycombinator.com', 'success', 'Crawl Started')}
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast('Warning: Crawl speed throttled due to 429 response', 'warning', 'Rate Limited')}
                >
                  Trigger Warning Toast
                </Button>
                <Button
                  variant="danger"
                  onClick={() => toast('Fatal SSRF error: Private IP address range blocked', 'error', 'Security Alert')}
                >
                  Trigger Error Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Demo Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Inspector Modal / Mobile Bottom Sheet"
        description="Responsive dialog that automatically presents as a bottom sheet on mobile screens (<640px) and a centered modal on desktop."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-sunken border border-line flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
            <div className="text-xs text-ink-secondary">
              Accessible keyboard navigation active. Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-ink-strong">Esc</kbd> to dismiss this dialog.
            </div>
          </div>
          <p className="text-sm text-ink-secondary">
            This sheet primitive is utilized by the Page Inspector, Crawl Diff Modal, and Export Menus across the platform.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-line">
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Close Dialog
            </Button>
            <Button variant="primary" onClick={() => {
              setIsSheetOpen(false);
              toast('Inspection parameters saved', 'info');
            }}>
              Confirm
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
