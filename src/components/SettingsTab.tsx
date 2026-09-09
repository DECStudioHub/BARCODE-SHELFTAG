import React, { useState, useRef } from 'react';
import {
  Settings,
  Palette,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Check,
  Trash2,
  Building,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  Tag,
  Link as LinkIcon,
  Database,
  Download,
  FileJson,
} from 'lucide-react';
import {
  SystemSettings,
  ColorPaletteId,
  LayoutConfig,
  InventoryItem,
  ValidationSummary,
} from '../types';
import {
  PALETTES,
  PRESET_LOGOS,
  getPaletteTheme,
} from '../utils/theme';
import { DEMO_ITEMS, revalidateItems } from '../utils/excelParser';
import { BackupRestoreModal } from './BackupRestoreModal';
import { exportSystemBackup } from '../utils/systemBackup';

interface SettingsTabProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  config: LayoutConfig;
  onUpdateConfig: (newConfig: LayoutConfig) => void;
  items: InventoryItem[];
  onResetData: () => void;
  onLoadSampleData: () => void;
  onResetLayout: () => void;
  onFactoryReset: () => void;
  onNavigateToStep: (step: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  config,
  onUpdateConfig,
  items,
  onResetData,
  onLoadSampleData,
  onResetLayout,
  onFactoryReset,
  onNavigateToStep,
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'palette' | 'logo' | 'data'>('branding');
  const [nameInput, setNameInput] = useState(settings.systemName);
  const [taglineInput, setTaglineInput] = useState(settings.systemTagline);
  const [subtitleInput, setSubtitleInput] = useState(settings.systemSubtitle);
  const [customHexInput, setCustomHexInput] = useState(settings.customPrimaryColor || '#047857');
  const [urlLogoInput, setUrlLogoInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Confirm dialog state for data resets
  const [confirmAction, setConfirmAction] = useState<{
    type: 'clear_data' | 'reset_layout' | 'reset_branding' | 'factory_reset';
    title: string;
    description: string;
    actionLabel: string;
    isDangerous?: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTheme = getPaletteTheme(settings.paletteId, settings.customPrimaryColor);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // 1. Handle System Name & Identity
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemSettings = {
      ...settings,
      systemName: nameInput.trim() || 'SHELF TAG',
      systemTagline: taglineInput.trim() || 'Inventory System',
      systemSubtitle: subtitleInput.trim() || 'Excel to Printable Barcode Tags',
    };
    onUpdateSettings(updated);
    showNotification('System identity updated successfully!');
  };

  // 2. Handle Palette Change
  const handleSelectPalette = (paletteId: ColorPaletteId) => {
    const updated: SystemSettings = {
      ...settings,
      paletteId,
      customPrimaryColor: paletteId === 'custom' ? customHexInput : settings.customPrimaryColor,
    };
    onUpdateSettings(updated);
    showNotification(`Switched color palette to ${getPaletteTheme(paletteId, customHexInput).name}`);
  };

  const handleCustomHexChange = (hex: string) => {
    setCustomHexInput(hex);
    if (settings.paletteId === 'custom') {
      onUpdateSettings({
        ...settings,
        customPrimaryColor: hex,
      });
    }
  };

  // 3. Handle Logo Selection & Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated: SystemSettings = {
          ...settings,
          customLogoUrl: dataUrl,
        };
        onUpdateSettings(updated);

        // Also apply to shelf tags if toggle is enabled
        if (settings.applyLogoToShelfTags) {
          onUpdateConfig({
            ...config,
            logoUrl: dataUrl,
            showLogo: true,
          });
        }
        showNotification('Custom logo uploaded and applied successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrlLogo = () => {
    if (!urlLogoInput.trim()) return;
    const updated: SystemSettings = {
      ...settings,
      customLogoUrl: urlLogoInput.trim(),
    };
    onUpdateSettings(updated);

    if (settings.applyLogoToShelfTags) {
      onUpdateConfig({
        ...config,
        logoUrl: urlLogoInput.trim(),
        showLogo: true,
      });
    }
    setUrlLogoInput('');
    showNotification('Logo URL applied successfully!');
  };

  const handleSelectPresetLogo = (presetUrl: string) => {
    const updated: SystemSettings = {
      ...settings,
      customLogoUrl: presetUrl,
    };
    onUpdateSettings(updated);

    if (settings.applyLogoToShelfTags) {
      onUpdateConfig({
        ...config,
        logoUrl: presetUrl,
        showLogo: true,
      });
    }
    showNotification('Preset logo selected!');
  };

  const handleToggleShelfTagSync = (checked: boolean) => {
    onUpdateSettings({
      ...settings,
      applyLogoToShelfTags: checked,
    });
    if (checked && settings.customLogoUrl) {
      onUpdateConfig({
        ...config,
        logoUrl: settings.customLogoUrl,
        showLogo: true,
      });
    }
  };

  const handleResetLogo = () => {
    const defaultLogo = '/prince-logo.svg';
    onUpdateSettings({
      ...settings,
      customLogoUrl: defaultLogo,
    });
    if (settings.applyLogoToShelfTags) {
      onUpdateConfig({
        ...config,
        logoUrl: defaultLogo,
      });
    }
    showNotification('Logo reset to default Prince Retail badge.');
  };

  // 4. Reset execution
  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'clear_data') {
      onResetData();
      showNotification('Inventory data cleared. Starting fresh on Step 1.', 'info');
    } else if (confirmAction.type === 'reset_layout') {
      onResetLayout();
      showNotification('Layout configuration reset to default 9-per-page A4 specs.');
    } else if (confirmAction.type === 'reset_branding') {
      setNameInput('SHELF TAG');
      setTaglineInput('Inventory System');
      setSubtitleInput('Excel to Printable Barcode Tags');
      onUpdateSettings({
        systemName: 'SHELF TAG',
        systemTagline: 'Inventory System',
        systemSubtitle: 'Excel to Printable Barcode Tags',
        paletteId: 'emerald',
        customPrimaryColor: '#047857',
        customLogoUrl: '/prince-logo.svg',
        applyLogoToShelfTags: true,
      });
      showNotification('Branding and color palette reset to defaults.');
    } else if (confirmAction.type === 'factory_reset') {
      onFactoryReset();
      showNotification('System has undergone a full factory reset.', 'info');
    }

    setConfirmAction(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-xs transition-colors"
              style={{ backgroundColor: activeTheme.primary }}
            >
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-zinc-900 tracking-tight">System Settings</h1>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: activeTheme.primaryLight,
                    borderColor: activeTheme.primaryBorder,
                    color: activeTheme.primaryText,
                  }}
                >
                  Customization Hub
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize your system identity, color palette, custom corporate logo, or manage and reset inventory data.
              </p>
            </div>
          </div>

          {/* Quick Step Jump buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToStep('configure')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tag Layout</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStep(items.length > 0 ? 'validate' : 'import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all shadow-xs cursor-pointer"
              style={{ backgroundColor: activeTheme.primary }}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {feedbackMsg && (
          <div
            className="mt-4 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all animate-fadeIn"
            style={{
              backgroundColor: activeTheme.primaryLight,
              borderColor: activeTheme.primaryBorder,
              color: activeTheme.primaryText,
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'branding'
                ? 'text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            style={{
              backgroundColor: activeTab === 'branding' ? activeTheme.primary : 'transparent',
            }}
          >
            <Building className="w-4 h-4" />
            <span>1. System Name & Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('palette')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'palette'
                ? 'text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            style={{
              backgroundColor: activeTab === 'palette' ? activeTheme.primary : 'transparent',
            }}
          >
            <Palette className="w-4 h-4" />
            <span>2. Color Palette</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'logo'
                ? 'text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            style={{
              backgroundColor: activeTab === 'logo' ? activeTheme.primary : 'transparent',
            }}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Custom Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'data'
                ? 'text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            style={{
              backgroundColor: activeTab === 'data' ? activeTheme.primary : 'transparent',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>4. Reset & Data Management</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SYSTEM NAME & BRANDING */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900">System Identity & Title</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Customize the application name, branch/department label, and tagline displayed in the header and printed outputs.
              </p>
            </div>

            <form onSubmit={handleSaveIdentity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  System Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. SHELF TAG, METRO MART, ABC LOGISTICS"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 font-medium"
                  style={{ '--tw-ring-color': activeTheme.primary } as any}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Appears prominently in the navigation bar, printable sheet headers, and browser window title.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  System Badge / Category
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  placeholder="e.g. Inventory System, Warehouse Dept, Retail Branch"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 font-medium"
                  style={{ '--tw-ring-color': activeTheme.primary } as any}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  A badge shown right beside your system name in the header.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  value={subtitleInput}
                  onChange={(e) => setSubtitleInput(e.target.value)}
                  placeholder="e.g. Excel to Printable Barcode Tags"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 font-medium"
                  style={{ '--tw-ring-color': activeTheme.primary } as any}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Secondary description shown below your system title.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setNameInput('SHELF TAG');
                    setTaglineInput('Inventory System');
                    setSubtitleInput('Excel to Printable Barcode Tags');
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  Reset to Default Names
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-2"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  <Check className="w-4 h-4" />
                  <span>Save System Name</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span>Header Live Preview</span>
            </h3>

            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  {settings.customLogoUrl ? (
                    <img
                      src={settings.customLogoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Tag className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm tracking-tight text-zinc-900">
                      {nameInput.trim() || 'SHELF TAG'}
                    </span>
                    <span
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border"
                      style={{
                        backgroundColor: activeTheme.primaryLight,
                        borderColor: activeTheme.primaryBorder,
                        color: activeTheme.primaryText,
                      }}
                    >
                      {taglineInput.trim() || 'Inventory System'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {subtitleInput.trim() || 'Excel to Printable Barcode Tags'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span>Display Status:</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Browser Title:</span>
                <span className="font-mono text-[11px] text-zinc-700 truncate max-w-[160px]">
                  {nameInput || 'SHELF TAG'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COLOR PALETTE */}
      {activeTab === 'palette' && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-zinc-900">System Color Palette</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Select a high-contrast, professional theme or configure your company's exact primary brand hex color.
              </p>
            </div>

            <div
              className="px-3 py-1.5 rounded-lg border flex items-center gap-2 shrink-0 text-xs font-bold"
              style={{
                backgroundColor: activeTheme.primaryLight,
                borderColor: activeTheme.primaryBorder,
                color: activeTheme.primaryText,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
              <span>Active: {activeTheme.name}</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(PALETTES).map((pal) => {
              const isSelected = settings.paletteId === pal.id;
              return (
                <div
                  key={pal.id}
                  onClick={() => handleSelectPalette(pal.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-50/50 ring-2 ring-zinc-900/10'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-white"
                          style={{ backgroundColor: pal.primary }}
                        />
                        <span className="font-bold text-sm text-zinc-900">{pal.name}</span>
                      </div>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: pal.primary }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-500 line-clamp-2">{pal.description}</p>
                  </div>

                  {/* Swatch strip */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5">
                    <div className="h-4 flex-1 rounded-sm" style={{ backgroundColor: pal.primary }} title="Primary" />
                    <div className="h-4 flex-1 rounded-sm" style={{ backgroundColor: pal.primaryHover }} title="Hover" />
                    <div className="h-4 flex-1 rounded-sm border border-zinc-200" style={{ backgroundColor: pal.primaryLight }} title="Light tint" />
                    <div className="h-4 flex-1 rounded-sm border border-zinc-200" style={{ backgroundColor: pal.primaryBorder }} title="Border accent" />
                  </div>
                </div>
              );
            })}

            {/* Custom Brand Hex Color Card */}
            <div
              onClick={() => handleSelectPalette('custom')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between ${
                settings.paletteId === 'custom'
                  ? 'border-zinc-900 bg-zinc-50/50 ring-2 ring-zinc-900/10'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full shadow-xs border border-white"
                      style={{ backgroundColor: customHexInput }}
                    />
                    <span className="font-bold text-sm text-zinc-900">Custom Brand</span>
                  </div>
                  {settings.paletteId === 'custom' && (
                    <div
                      className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: customHexInput }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500">Pick any corporate brand hex color</p>
              </div>

              {/* Color picker controls */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                <input
                  type="color"
                  value={customHexInput}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-zinc-300 p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={customHexInput}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  placeholder="#047857"
                  className="flex-1 px-2 py-1 text-xs font-mono font-bold border border-zinc-300 rounded-md uppercase"
                />
              </div>
            </div>
          </div>

          {/* Interactive Live Element Previews */}
          <div className="mt-8 p-5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-500" />
              <span>Theme Applied to Interactive Elements</span>
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Primary Button
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-bold border transition-colors"
                style={{
                  backgroundColor: activeTheme.primaryLight,
                  borderColor: activeTheme.primaryBorder,
                  color: activeTheme.primaryText,
                }}
              >
                Secondary Tag
              </button>

              <span
                className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: activeTheme.primaryLight,
                  borderColor: activeTheme.primaryBorder,
                  color: activeTheme.primaryText,
                }}
              >
                Badge Pill
              </span>

              <div
                className="px-3 py-1.5 rounded-lg border font-mono text-xs font-bold"
                style={{
                  borderColor: activeTheme.primary,
                  color: activeTheme.primaryText,
                }}
              >
                Hex: {activeTheme.hex}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM SYSTEM LOGO */}
      {activeTab === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Custom Corporate & Store Logo</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Upload your company or warehouse logo. It will appear on the top navigation header and can optionally be printed onto every shelf tag.
              </p>
            </div>

            {/* Upload Zone */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Upload New Image File
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-6 text-center cursor-pointer bg-zinc-50/60 hover:bg-zinc-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-zinc-200 flex items-center justify-center mx-auto text-zinc-600 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-800">
                  Click to browse or drag and drop your logo file
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PNG, JPG, SVG, or WebP up to 4MB (Transparent backgrounds recommended)
                </p>
              </div>
            </div>

            {/* Option: Enter Image URL */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Or Load from Web URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="url"
                    value={urlLogoInput}
                    onChange={(e) => setUrlLogoInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyUrlLogo}
                  disabled={!urlLogoInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Apply URL
                </button>
              </div>
            </div>

            {/* Preset Logos */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Or Choose from Ready Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_LOGOS.map((preset) => {
                  const isCurrent = settings.customLogoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetLogo(preset.url)}
                      className={`p-3 rounded-lg border text-left flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center overflow-hidden bg-white">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-800 text-center">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sync toggle */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.applyLogoToShelfTags}
                  onChange={(e) => handleToggleShelfTagSync(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Automatically print this logo on Shelf Tags
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    Synchronizes your system logo to tag headers when printing
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Logo Live Preview Panel */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-6">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span>Current Logo Preview</span>
            </h3>

            {/* Large Preview */}
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xs border border-zinc-200 flex items-center justify-center p-3 overflow-hidden">
                {settings.customLogoUrl ? (
                  <img
                    src={settings.customLogoUrl}
                    alt="Active Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Tag className="w-10 h-10 text-zinc-400" />
                )}
              </div>
              <span className="mt-3 text-xs font-bold text-zinc-700">Active System Logo</span>
              <span className="text-[11px] text-zinc-400">
                {settings.customLogoUrl.startsWith('data:') ? 'Custom Uploaded Image' : 'Vector Image URL'}
              </span>
            </div>

            {/* How it looks on a Shelf Tag Header */}
            <div className="p-4 bg-white rounded-lg border-2 border-black space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Sample Shelf Tag Header Appearance
              </span>
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5 pt-1">
                <div className="flex items-center gap-1">
                  <span className="font-black text-xs">Locator:</span>
                  <span className="bg-black text-white px-1.5 py-0.5 rounded-xs font-mono font-bold text-[11px]">
                    A01-01
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-600 font-bold">#001</span>
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-200 flex items-center justify-center bg-white">
                    <img
                      src={settings.customLogoUrl || '/prince-logo.svg'}
                      alt="Tag Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESET & DATA MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Data Management & Reset Controls</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Reset imported inventory items, restore tag layout geometry to defaults, or execute a clean factory reset.
            </p>
          </div>

          {/* Data Status Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-medium text-zinc-500 block">Loaded Inventory Items</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block font-mono">
                {items.length}
              </span>
              <span className="text-[11px] text-zinc-400">
                {items.length > 0 ? `${items.filter(i => i.isSelected !== false).length} selected for print` : 'No data currently imported'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-medium text-zinc-500 block">Active Layout</span>
              <span className="text-2xl font-black text-zinc-900 mt-1 block">
                {config.paperSize} ({config.columns * 3} Tags)
              </span>
              <span className="text-[11px] text-zinc-400">
                {config.tagWidthMm}mm × {config.tagHeightMm}mm per tag
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-medium text-zinc-500 block">Storage Persistence</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                Synced
              </span>
              <span className="text-[11px] text-zinc-400">Local browser state active</span>
            </div>
          </div>

          {/* Backup & Restore Section (Mandatory Feature) */}
          <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Database className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">
                    System-Wide Backup & Restore (JSON)
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Export all inventory items, Count Sheet presets & table settings, custom logos, and layout configurations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      exportSystemBackup();
                      showNotification('System backup downloaded successfully!');
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBackupModal(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-2xs cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Restore from File...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
            {/* 1. Clear Inventory Data */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm mb-1">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Clear Inventory Data</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Deletes all imported rows, counts, and validation results. Returns you back to Step 1 to import a new Excel file. Preserves your custom branding and layout settings.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  {items.length} items will be cleared
                </span>
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() =>
                    setConfirmAction({
                      type: 'clear_data',
                      title: 'Clear Inventory Items?',
                      description: 'This will erase the currently imported Excel items and counts from the workspace. You can re-import your Excel file anytime.',
                      actionLabel: 'Yes, Clear Inventory Data',
                      isDangerous: false,
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Data
                </button>
              </div>
            </div>

            {/* 2. Load Sample Demo Items */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Load Sample Supermarket Data</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Instantly populates the system with 12 realistic retail inventory items with locators, barcodes, quantities, and scanner names for testing layout & print sheets.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">12 demo records</span>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSampleData();
                    showNotification('Sample demo inventory items loaded successfully!');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  Load 12 Items
                </button>
              </div>
            </div>

            {/* 3. Reset Layout Settings */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm mb-1">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Reset Tag Layout to Default</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Resets print margins, tag height (86mm), tag width (64mm), 9 tags per A4 sheet, barcode height, and COUNT box customizations back to standard factory settings.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">9 tags / A4 layout</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      type: 'reset_layout',
                      title: 'Reset Tag Layout Settings?',
                      description: 'This will reset all print dimensions, margins, barcode sizes, and COUNT box adjustments back to the default 9-per-A4 sheet specifications.',
                      actionLabel: 'Reset Layout',
                      isDangerous: false,
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Layout
                </button>
              </div>
            </div>

            {/* 4. Reset Branding & Identity */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm mb-1">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Reset Branding to Default</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Resets the system name to "SHELF TAG", reverts the color palette to Emerald Green, and restores the original Prince Retail crown logo.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Emerald / SHELF TAG</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      type: 'reset_branding',
                      title: 'Reset Branding & Palette?',
                      description: 'This will revert your system name, color scheme, and logo back to the original default branding.',
                      actionLabel: 'Reset Branding',
                      isDangerous: false,
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Branding
                </button>
              </div>
            </div>
          </div>

          {/* DANGER ZONE: Full Factory Reset */}
          <div className="mt-6 p-5 rounded-xl border-2 border-red-200 bg-red-50/40 space-y-3">
            <div className="flex items-center gap-2.5 text-red-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Danger Zone: Full Factory Reset</span>
            </div>
            <p className="text-xs text-red-700">
              Completely wipes all saved local storage, including imported inventory rows, customized tag layouts, branding colors, custom uploaded logos, and session notes. The application will be returned to its pristine initial state.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    type: 'factory_reset',
                    title: 'Perform Full Factory Reset?',
                    description: 'WARNING: This will permanently wipe all local inventory data, custom logos, palettes, and layout adjustments. This action cannot be undone.',
                    actionLabel: 'Yes, Factory Reset Everything',
                    isDangerous: true,
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Full Factory Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction.isDangerous
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-900">{confirmAction.title}</h3>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              {confirmAction.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs cursor-pointer ${
                  confirmAction.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-zinc-900 hover:bg-black'
                }`}
              >
                {confirmAction.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onRestoreComplete={() => {
          showNotification('System backup restored successfully!');
        }}
      />
    </div>
  );
};
