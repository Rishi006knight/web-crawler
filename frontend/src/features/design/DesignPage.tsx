import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { Play, Download, Search, Check, AlertTriangle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export function DesignPage({ onBack }: { onBack: () => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 text-left">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Mission Control Design System
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Component tokens, accessibility states, color ramps, and design specifications.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500 mr-1.5" /> : <Moon className="w-4 h-4 text-indigo-400 mr-1.5" />}
            <span>Theme: {theme}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onBack}>
            Back to App
          </Button>
        </div>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          Buttons & States
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          Badges & Status Chips
        </h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default (Sky)</Badge>
          <Badge variant="success">Success (Emerald)</Badge>
          <Badge variant="warning">Warning (Amber)</Badge>
          <Badge variant="error">Error (Red)</Badge>
          <Badge variant="neutral">Neutral (Slate)</Badge>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          Inputs & Forms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <Input label="Normal Input" placeholder="Type here..." />
          <Input label="Input with Helper" placeholder="With helper text" helperText="Helpful instructions go here." />
          <Input label="Input with Error" placeholder="Invalid value" error="This field is required." />
        </div>
      </section>

      {/* Progress Bars */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          Progress Bars & Skeletons
        </h2>
        <div className="space-y-4 max-w-xl">
          <div>
            <div className="text-xs text-slate-400 mb-1">Standard 65%</div>
            <ProgressBar value={65} max={100} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Multi-Segmented (Fetched / Skipped / Failed)</div>
            <ProgressBar
              value={45}
              max={100}
              segments={{ fetched: 45, skipped: 15, failed: 5, total: 100 }}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Content Skeleton Loader</div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
