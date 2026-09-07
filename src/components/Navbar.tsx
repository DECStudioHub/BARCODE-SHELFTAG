import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  Printer,
  RotateCcw,
  Tag,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { AppStep, InventorySession, SystemSettings } from '../types';
import { getPaletteTheme } from '../utils/theme';

interface NavbarProps {
  currentStep: AppStep;
  onSelectStep: (step: AppStep) => void;
  itemCount: number;
  selectedCount: number;
  session: InventorySession;
  settings: SystemSettings;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onSelectStep,
  itemCount,
  selectedCount,
  session,
  settings,
  onReset,
}) => {
  const activeTheme = getPaletteTheme(settings.paletteId, settings.customPrimaryColor);

  const steps: { id: AppStep; label: string; number: number; icon: any }[] = [
    { id: 'import', label: '1. Import Excel', number: 1, icon: FileSpreadsheet },
    { id: 'validate', label: '2. Validate & Edit', number: 2, icon: CheckCircle2 },
    { id: 'configure', label: '3. Configure Layout', number: 3, icon: Sliders },
    { id: 'preview', label: '4. Preview & Print', number: 4, icon: Printer },
  ];

  const getStepStatus = (stepId: AppStep) => {
    const stepOrder: AppStep[] = ['import', 'validate', 'configure', 'preview'];
    const currentIdx = stepOrder.indexOf(currentStep);
    const targetIdx = stepOrder.indexOf(stepId);

    if (currentIdx === targetIdx) return 'current';
    if (targetIdx < currentIdx || (itemCount > 0 && targetIdx <= 2)) return 'accessible';
    return 'disabled';
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onSelectStep('import')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
            title="Go to Home / Import"
          >
            <div
              className="w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-xs overflow-hidden transition-transform group-hover:scale-105"
              style={{ backgroundColor: activeTheme.primary }}
            >
              {settings.customLogoUrl ? (
                <img
                  src={settings.customLogoUrl}
                  alt="System Logo"
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Tag className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm tracking-tight text-zinc-900 group-hover:text-black">
                  {settings.systemName || 'SHELF TAG'}
                </span>
                <span
                  className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border transition-colors"
                  style={{
                    backgroundColor: activeTheme.primaryLight,
                    borderColor: activeTheme.primaryBorder,
                    color: activeTheme.primaryText,
                  }}
                >
                  {settings.systemTagline || 'Inventory System'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[200px] sm:max-w-none">
                {settings.systemSubtitle || 'Excel to Printable Barcode Tags'}
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              const isCurrent = status === 'current';
              const isAccessible = status === 'accessible' || itemCount > 0;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div
                      className="w-4 h-0.5 mx-0.5 transition-colors"
                      style={{
                        backgroundColor:
                          getStepStatus(steps[idx - 1].id) === 'accessible' || isCurrent
                            ? activeTheme.primary
                            : '#e4e4e7',
                      }}
                    />
                  )}

                  <button
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => onSelectStep(step.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'text-white shadow-xs'
                        : isAccessible
                        ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                        : 'text-zinc-400 cursor-not-allowed opacity-50'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? activeTheme.primary : 'transparent',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Session / Item Count Quick Status & Right Actions */}
          <div className="flex items-center gap-2">
            {itemCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-zinc-100/80 px-2.5 py-1.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-500 font-medium">Tags:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {selectedCount} / {itemCount}
                </span>
                {session.branch && (
                  <span className="border-l border-zinc-300 pl-2 text-zinc-600 font-medium truncate max-w-[110px]">
                    {session.branch}
                  </span>
                )}
              </div>
            )}

            {/* Quick Settings Icon Button (especially handy for mobile/tablet) */}
            <button
              type="button"
              onClick={() => onSelectStep('settings')}
              title="Open System Settings & Customization"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                currentStep === 'settings'
                  ? 'text-white border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200'
              }`}
              style={{
                backgroundColor: currentStep === 'settings' ? activeTheme.primary : 'transparent',
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {itemCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                title="Start over with a new Excel file"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New File</span>
              </button>
            )}

            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full app in a new browser tab (recommended for printing and downloading)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-300 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
