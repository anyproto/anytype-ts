import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Title, Button, Icon, Input } from 'Component';
import * as I from 'Interface';

interface ThemeColorVar {
	key: string;
	label: string;
	desc: string;
	defaultValue: string;
	type?: 'color' | 'text' | 'size' | 'font-family';
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
}

interface ThemeCategory {
	title: string;
	icon: string;
	vars: ThemeColorVar[];
}

const THEME_CATEGORIES: ThemeCategory[] = [
	{
		title: 'App Surfaces & Backgrounds',
		icon: 'settings/overview',
		vars: [
			{ key: '--color-bg-primary', label: 'Primary Background', desc: 'Main window and document background', defaultValue: '#171717', type: 'color' },
			{ key: '--color-bg-secondary', label: 'Secondary Background', desc: 'Modal dialogs, popups and dropdowns', defaultValue: '#191919', type: 'color' },
			{ key: '--color-shape-highlight-light-solid', label: 'Sidebar Solid Background', desc: 'Left navigation and vault rail background', defaultValue: '#1e1e1e', type: 'color' },
			{ key: '--color-shape-highlight-light', label: 'Card Surface (Light)', desc: 'Background for cards, tables and panels', defaultValue: 'rgba(255, 255, 255, 0.03)', type: 'color' },
			{ key: '--color-shape-highlight-medium', label: 'Card Surface (Medium)', desc: 'Hover states, chips and secondary surfaces', defaultValue: 'rgba(255, 255, 255, 0.05)', type: 'color' },
			{ key: '--color-shape-highlight-dark', label: 'Card Surface (Dark)', desc: 'Active states, pressed cards and headers', defaultValue: 'rgba(255, 255, 255, 0.11)', type: 'color' },
		],
	},
	{
		title: 'Typography & Text Colors',
		icon: 'settings/style',
		vars: [
			{ key: '--color-text-primary', label: 'Primary Text', desc: 'Main headings, body text and labels', defaultValue: '#e1e1e1', type: 'color' },
			{ key: '--color-text-secondary', label: 'Secondary Text', desc: 'Subtitles, captions and secondary details', defaultValue: '#a3a3a3', type: 'color' },
			{ key: '--color-text-tertiary', label: 'Tertiary / Muted Text', desc: 'Placeholders, timestamps and hints', defaultValue: '#5c5c5c', type: 'color' },
			{ key: '--color-text-inversion', label: 'Inverted Text', desc: 'Text on contrasting buttons or highlights', defaultValue: '#171717', type: 'color' },
		],
	},
	{
		title: 'Borders & Outlines',
		icon: 'settings/storage',
		vars: [
			{ key: '--color-shape-primary', label: 'Primary Border', desc: 'Main container outlines and separators', defaultValue: '#313131', type: 'color' },
			{ key: '--color-shape-secondary', label: 'Secondary Border', desc: 'Card borders, table dividers and inputs', defaultValue: '#292929', type: 'color' },
			{ key: '--color-shape-tertiary', label: 'Tertiary Border', desc: 'Subtle separators and inactive lines', defaultValue: '#232323', type: 'color' },
		],
	},
	{
		title: 'Controls, Buttons & Accents',
		icon: 'sync/globe',
		vars: [
			{ key: '--color-control-accent', label: 'Control Accent', desc: 'Action buttons, active highlights and focus rings', defaultValue: '#d4d4d4', type: 'color' },
			{ key: '--color-control-active', label: 'Control Active', desc: 'Active switches, checkboxes and icons', defaultValue: '#737373', type: 'color' },
			{ key: '--color-control-inactive', label: 'Control Inactive', desc: 'Disabled switches and muted icons', defaultValue: '#414141', type: 'color' },
			{ key: '--color-red', label: 'Destructive / Red', desc: 'Delete buttons, error alerts and warnings', defaultValue: '#f25040', type: 'color' },
			{ key: '--color-blue', label: 'Accent Blue', desc: 'Links and informational highlights', defaultValue: '#6878ee', type: 'color' },
			{ key: '--color-purple', label: 'Accent Purple', desc: 'Tags and special badges', defaultValue: '#c870e8', type: 'color' },
		],
	},
	{
		title: 'Fonts',
		icon: 'settings/type',
		vars: [
			{ key: '--font-family-base', label: 'Main Font Family', desc: 'Select any installed system font or default Inter', defaultValue: "'Inter'", type: 'font-family' },
			{ key: '--font-size-common', label: 'Base Body Size', desc: 'Standard body text across UI and sidebar', defaultValue: '15px', type: 'size', min: 11, max: 24, step: 0.5, unit: 'px' },
			{ key: '--font-size-paragraph', label: 'Paragraph Size', desc: 'Document body paragraphs and notes', defaultValue: '16px', type: 'size', min: 12, max: 26, step: 0.5, unit: 'px' },
			{ key: '--font-size-small', label: 'Small / Metadata Size', desc: 'Captions, hints, dates and badges', defaultValue: '13px', type: 'size', min: 9, max: 18, step: 0.5, unit: 'px' },
			{ key: '--font-size-title', label: 'Document Title Size', desc: 'Main page and document title', defaultValue: '36px', type: 'size', min: 20, max: 56, step: 1, unit: 'px' },
			{ key: '--font-size-header1', label: 'Header 1 Size', desc: 'Major section headings (H1)', defaultValue: '29px', type: 'size', min: 18, max: 44, step: 1, unit: 'px' },
			{ key: '--font-size-header2', label: 'Header 2 Size', desc: 'Secondary section headings (H2)', defaultValue: '23px', type: 'size', min: 14, max: 34, step: 1, unit: 'px' },
			{ key: '--font-size-header3', label: 'Header 3 Size', desc: 'Subsection headings (H3)', defaultValue: '19px', type: 'size', min: 12, max: 28, step: 1, unit: 'px' },
			{ key: '--line-height-common', label: 'Base Line Height', desc: 'Line spacing for body text', defaultValue: '23px', type: 'size', min: 14, max: 36, step: 1, unit: 'px' },
			{ key: '--line-height-paragraph', label: 'Paragraph Line Height', desc: 'Line spacing for paragraphs', defaultValue: '25px', type: 'size', min: 16, max: 40, step: 1, unit: 'px' },
			{ key: '--letter-spacing-common', label: 'Letter Spacing', desc: 'Character tracking for body text', defaultValue: '-0.1px', type: 'size', min: -1, max: 2, step: 0.05, unit: 'px' },
		],
	},
];

const FONT_PRESETS: { name: string; desc: string; fontFamily: string }[] = [
	{ name: 'Inter (Default)', desc: 'Original Anytype font', fontFamily: "'Inter'" },
	{ name: 'System Native', desc: 'Apple San Francisco / Windows Segoe UI', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
	{ name: 'IBM Plex Sans', desc: 'Technical and engineered typography', fontFamily: "'Plex', 'IBM Plex Sans', sans-serif" },
	{ name: 'Monospace Code', desc: 'Developer style monospaced font', fontFamily: "'JetBrains Mono', 'Fira Code', 'Plex Mono', monospace" },
	{ name: 'Editorial Serif', desc: 'Warm book and article editorial style', fontFamily: "'Georgia', 'Merriweather', 'Charter', serif" },
	{ name: 'Outfit / Geometric', desc: 'Friendly geometric rounded sans', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" },
];

const FONT_SCALE_PRESETS: { name: string; desc: string; sizes: Record<string, string> }[] = [
	{
		name: 'Compact (Dense UI)',
		desc: 'Smaller text for power users',
		sizes: {
			'--font-size-common': '13.5px',
			'--font-size-paragraph': '14.5px',
			'--font-size-small': '11.5px',
			'--font-size-title': '30px',
			'--font-size-header1': '24px',
			'--font-size-header2': '20px',
			'--font-size-header3': '16.5px',
			'--line-height-common': '20px',
			'--line-height-paragraph': '22px',
		},
	},
	{
		name: 'Standard (Default)',
		desc: 'Balanced Anytype proportions',
		sizes: {
			'--font-size-common': '15px',
			'--font-size-paragraph': '16px',
			'--font-size-small': '13px',
			'--font-size-title': '36px',
			'--font-size-header1': '29px',
			'--font-size-header2': '23px',
			'--font-size-header3': '19px',
			'--line-height-common': '23px',
			'--line-height-paragraph': '25px',
		},
	},
	{
		name: 'Comfortable (+10%)',
		desc: 'Spacious and relaxed reading',
		sizes: {
			'--font-size-common': '16.5px',
			'--font-size-paragraph': '17.5px',
			'--font-size-small': '14px',
			'--font-size-title': '40px',
			'--font-size-header1': '32px',
			'--font-size-header2': '25px',
			'--font-size-header3': '21px',
			'--line-height-common': '25px',
			'--line-height-paragraph': '28px',
		},
	},
	{
		name: 'Large (+20%)',
		desc: 'High clarity and accessibility',
		sizes: {
			'--font-size-common': '18px',
			'--font-size-paragraph': '19.5px',
			'--font-size-small': '15px',
			'--font-size-title': '44px',
			'--font-size-header1': '35px',
			'--font-size-header2': '28px',
			'--font-size-header3': '23px',
			'--line-height-common': '28px',
			'--line-height-paragraph': '31px',
		},
	},
];

const PRESETS: { name: string; desc: string; colors: Record<string, string> }[] = [
	{
		name: 'Default Dark',
		desc: 'Standard Anytype charcoal dark mode',
		colors: {
			'--color-bg-primary': '#171717',
			'--color-bg-secondary': '#191919',
			'--color-shape-highlight-light-solid': '#1e1e1e',
			'--color-shape-highlight-light': 'rgba(255, 255, 255, 0.03)',
			'--color-shape-highlight-medium': 'rgba(255, 255, 255, 0.05)',
			'--color-shape-highlight-dark': 'rgba(255, 255, 255, 0.11)',
			'--color-text-primary': '#e1e1e1',
			'--color-text-secondary': '#a3a3a3',
			'--color-text-tertiary': '#5c5c5c',
			'--color-shape-primary': '#313131',
			'--color-shape-secondary': '#292929',
			'--color-shape-tertiary': '#232323',
			'--color-control-accent': '#d4d4d4',
			'--color-control-active': '#737373',
			'--color-red': '#f25040',
			'--color-blue': '#6878ee',
			'--color-purple': '#c870e8',
		},
	},
	{
		name: 'OLED Pure Black',
		desc: 'Deep pitch black for OLED screens',
		colors: {
			'--color-bg-primary': '#000000',
			'--color-bg-secondary': '#0a0a0a',
			'--color-shape-highlight-light-solid': '#0d0d0d',
			'--color-shape-highlight-light': 'rgba(255, 255, 255, 0.04)',
			'--color-shape-highlight-medium': 'rgba(255, 255, 255, 0.08)',
			'--color-shape-highlight-dark': 'rgba(255, 255, 255, 0.15)',
			'--color-text-primary': '#ffffff',
			'--color-text-secondary': '#b0b0b0',
			'--color-text-tertiary': '#606060',
			'--color-shape-primary': '#242424',
			'--color-shape-secondary': '#1a1a1a',
			'--color-shape-tertiary': '#141414',
			'--color-control-accent': '#ffffff',
			'--color-control-active': '#909090',
			'--color-red': '#ff4d4f',
			'--color-blue': '#3b82f6',
			'--color-purple': '#a855f7',
		},
	},
	{
		name: 'Notion Minimal',
		desc: 'Warm charcoal & monochrome styling',
		colors: {
			'--color-bg-primary': '#191919',
			'--color-bg-secondary': '#202020',
			'--color-shape-highlight-light-solid': '#202020',
			'--color-shape-highlight-light': 'rgba(255, 255, 255, 0.035)',
			'--color-shape-highlight-medium': 'rgba(255, 255, 255, 0.06)',
			'--color-shape-highlight-dark': 'rgba(255, 255, 255, 0.12)',
			'--color-text-primary': '#ebebeb',
			'--color-text-secondary': '#9a9a97',
			'--color-text-tertiary': '#666664',
			'--color-shape-primary': '#373737',
			'--color-shape-secondary': '#2e2e2e',
			'--color-shape-tertiary': '#262626',
			'--color-control-accent': '#e0e0e0',
			'--color-control-active': '#8c8c8c',
			'--color-red': '#e05757',
			'--color-blue': '#529cca',
			'--color-purple': '#9d68d3',
		},
	},
	{
		name: 'Tokyo Night',
		desc: 'Atmospheric deep blue cyberpunk theme',
		colors: {
			'--color-bg-primary': '#1a1b26',
			'--color-bg-secondary': '#16161e',
			'--color-shape-highlight-light-solid': '#1f2335',
			'--color-shape-highlight-light': 'rgba(122, 162, 247, 0.05)',
			'--color-shape-highlight-medium': 'rgba(122, 162, 247, 0.10)',
			'--color-shape-highlight-dark': 'rgba(122, 162, 247, 0.18)',
			'--color-text-primary': '#c0caf5',
			'--color-text-secondary': '#9aa5ce',
			'--color-text-tertiary': '#565f89',
			'--color-shape-primary': '#292e42',
			'--color-shape-secondary': '#23283b',
			'--color-shape-tertiary': '#1c2030',
			'--color-control-accent': '#7aa2f7',
			'--color-control-active': '#bb9af7',
			'--color-red': '#f7768e',
			'--color-blue': '#7aa2f7',
			'--color-purple': '#bb9af7',
		},
	},
	{
		name: 'Catppuccin Mocha',
		desc: 'Soothing pastel palette for dark lovers',
		colors: {
			'--color-bg-primary': '#1e1e2e',
			'--color-bg-secondary': '#181825',
			'--color-shape-highlight-light-solid': '#24273a',
			'--color-shape-highlight-light': 'rgba(203, 166, 247, 0.04)',
			'--color-shape-highlight-medium': 'rgba(203, 166, 247, 0.08)',
			'--color-shape-highlight-dark': 'rgba(203, 166, 247, 0.15)',
			'--color-text-primary': '#cdd6f4',
			'--color-text-secondary': '#a6adc8',
			'--color-text-tertiary': '#6c7086',
			'--color-shape-primary': '#313244',
			'--color-shape-secondary': '#292a3c',
			'--color-shape-tertiary': '#212232',
			'--color-control-accent': '#cba6f7',
			'--color-control-active': '#89b4fa',
			'--color-red': '#f38ba8',
			'--color-blue': '#89b4fa',
			'--color-purple': '#cba6f7',
		},
	},
	{
		name: 'Soft Theme',
		desc: 'Soft dark & blurple aesthetics',
		colors: {
			'--color-bg-primary': '#000000',
			'--color-bg-secondary': '#0b0c0e',
			'--color-shape-highlight-light-solid': '#111214',
			'--color-shape-highlight-light': 'rgba(88, 101, 242, 0.08)',
			'--color-shape-highlight-medium': 'rgba(255, 255, 255, 0.06)',
			'--color-shape-highlight-dark': 'rgba(255, 255, 255, 0.12)',
			'--color-text-primary': '#f2f3f5',
			'--color-text-secondary': '#949ba4',
			'--color-text-tertiary': '#6d6f78',
			'--color-shape-primary': '#232428',
			'--color-shape-secondary': '#1b1c1e',
			'--color-shape-tertiary': '#141517',
			'--color-control-accent': '#5865f2',
			'--color-control-active': '#5865f2',
			'--color-red': '#f23f43',
			'--color-blue': '#5865f2',
			'--color-purple': '#eb459e',
		},
	},
	{
		name: 'Emerald Forest',
		desc: 'Earthy deep green tones',
		colors: {
			'--color-bg-primary': '#0f1a14',
			'--color-bg-secondary': '#0a120e',
			'--color-shape-highlight-light-solid': '#14241b',
			'--color-shape-highlight-light': 'rgba(82, 183, 136, 0.05)',
			'--color-shape-highlight-medium': 'rgba(82, 183, 136, 0.10)',
			'--color-shape-highlight-dark': 'rgba(82, 183, 136, 0.18)',
			'--color-text-primary': '#d8f3dc',
			'--color-text-secondary': '#95d5b2',
			'--color-text-tertiary': '#52b788',
			'--color-shape-primary': '#1b4332',
			'--color-shape-secondary': '#16382a',
			'--color-shape-tertiary': '#102b20',
			'--color-control-accent': '#74c69d',
			'--color-control-active': '#52b788',
			'--color-red': '#e63946',
			'--color-blue': '#48cae4',
			'--color-purple': '#b5838d',
		},
	},
];

const STORAGE_KEY = 'anytype_custom_theme';

export const applyThemeToDocument = (themeProps: Record<string, string>) => {
	const root = document.documentElement;
	Object.entries(themeProps).forEach(([key, val]) => {
		if (val) {
			root.style.setProperty(key, val);
		} else {
			root.style.removeProperty(key);
		}
	});
};

export const loadStoredTheme = (): Record<string, string> => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') return parsed;
		}
	} catch (e) {}
	return {};
};

const PageMainSettingsThemeCustomizer = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [themeProps, setThemeProps] = useState<Record<string, string>>(() => {
		return loadStoredTheme();
	});

	const [systemFonts, setSystemFonts] = useState<string[]>([]);
	const [activeCategory, setActiveCategory] = useState<number>(0);
	const [activePreset, setActivePreset] = useState<string>('');

	const getActiveFontValue = (currentFontProp?: string): string => {
		if (!currentFontProp || currentFontProp === "'Inter'" || currentFontProp === 'Inter') {
			return 'Inter';
		}
		const matchedPreset = FONT_PRESETS.find(p => p.fontFamily === currentFontProp);
		if (matchedPreset) {
			return matchedPreset.fontFamily;
		}
		// Extract the first family of a stack, e.g. "'Georgia', sans-serif" → "Georgia",
		// so the value matches the option it was set from
		const first = String(currentFontProp).split(',')[0].trim().replace(/^['"]|['"]$/g, '').trim();
		return first || currentFontProp;
	};

	useEffect(() => {
		const loadFonts = async () => {
			const fontSet = new Set<string>();

			if (typeof (window as any).queryLocalFonts === 'function') {
				try {
					const localFonts = await (window as any).queryLocalFonts();
					localFonts.forEach((f: any) => {
						if (f.family) fontSet.add(f.family);
					});
				} catch (e) {}
			}

			try {
				const ipcFonts = await Renderer.send('getSystemFonts');
				if (Array.isArray(ipcFonts)) {
					ipcFonts.forEach((f: string) => fontSet.add(f));
				}
			} catch (e) {}

			if (fontSet.size > 0) {
				setSystemFonts(Array.from(fontSet).sort((a, b) => a.localeCompare(b)));
			}
		};

		loadFonts();
	}, []);

	useEffect(() => {
		applyThemeToDocument(themeProps);
	}, [themeProps]);

	const handlePropChange = (key: string, value: string) => {
		const next = { ...themeProps, [key]: value };
		setThemeProps(next);
		applyThemeToDocument(next);
	};

	const applyColorPreset = (preset: typeof PRESETS[0]) => {
		setActivePreset(preset.name);
		const next = { ...themeProps, ...preset.colors };
		setThemeProps(next);
		applyThemeToDocument(next);
		Preview.toastShow({ text: `Applied "${preset.name}" theme palette` });
	};

	const applyFontFamily = (fontPreset: typeof FONT_PRESETS[0]) => {
		if (fontPreset.name.includes('Default')) {
			const next = { ...themeProps };
			delete next['--font-family-base'];
			setThemeProps(next);
			document.documentElement.style.removeProperty('--font-family-base');
			Preview.toastShow({ text: 'Restored default Anytype Inter font' });
		} else {
			handlePropChange('--font-family-base', fontPreset.fontFamily);
			Preview.toastShow({ text: `Applied font family: ${fontPreset.name}` });
		}
	};

	const applyFontScale = (scalePreset: typeof FONT_SCALE_PRESETS[0]) => {
		if (scalePreset.name.includes('Default')) {
			const next = { ...themeProps };
			Object.keys(scalePreset.sizes).forEach(k => {
				delete next[k];
				document.documentElement.style.removeProperty(k);
			});
			setThemeProps(next);
			Preview.toastShow({ text: 'Restored default Anytype typography scale' });
		} else {
			const next = { ...themeProps, ...scalePreset.sizes };
			setThemeProps(next);
			applyThemeToDocument(next);
			Preview.toastShow({ text: `Applied font scale: ${scalePreset.name}` });
		}
	};

	const saveTheme = () => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(themeProps));
			Preview.toastShow({ text: 'Theme & Typography settings saved successfully' });
		} catch (e: any) {
			Preview.toastShow({ icon: 'notice', text: `Failed to save: ${e.message}` });
		}
	};

	const resetToDefault = () => {
		localStorage.removeItem(STORAGE_KEY);
		setThemeProps({});
		setActivePreset('');
		const root = document.documentElement;
		THEME_CATEGORIES.forEach(cat => {
			cat.vars.forEach(v => {
				root.style.removeProperty(v.key);
			});
		});
		Preview.toastShow({ text: 'Reset all colors and typography to defaults' });
	};

	const exportThemeJson = () => {
		const payload = {
			name: activePreset || 'Custom Anytype Theme',
			version: '2.0',
			theme: themeProps,
		};
		U.Common.clipboardCopy({ text: JSON.stringify(payload, null, 2) });
		Preview.toastShow({ text: 'Theme & Typography JSON copied to clipboard' });
	};

	const importThemeJson = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);
				const imported = parsed.theme || parsed.colors || parsed;
				if (imported && typeof imported === 'object') {
					const merged = { ...themeProps, ...imported };
					setThemeProps(merged);
					applyThemeToDocument(merged);
					Preview.toastShow({ text: `Imported and merged theme from ${file.name}` });
				} else {
					throw new Error('Invalid theme format');
				}
			} catch (err: any) {
				Preview.toastShow({ icon: 'notice', text: `Failed to import theme: ${err.message}` });
			}
			if (fileInputRef.current) fileInputRef.current.value = '';
		};
		reader.readAsText(file);
	};

	const getDisplayColor = (key: string, defaultValue: string): string => {
		const current = themeProps[key] || defaultValue;
		if (current.startsWith('#') && (current.length === 7 || current.length === 4)) {
			return current;
		}
		return '#222222';
	};

	const isFontTab = THEME_CATEGORIES[activeCategory]?.title === 'Fonts';

	return (
		<div className="pageSettingsThemeCustomizer">
			<div className="titleWrapper">
				<div>
					<Title text="Theme Customizer" />
					<div className="titleSub">Customize component colors, backgrounds, borders, font families, and sizing scale.</div>
				</div>
				<div className="headerActions">
					<input
						type="file"
						ref={fileInputRef}
						accept=".json,application/json"
						style={{ display: 'none' }}
						onChange={importThemeJson}
					/>
					<Button
						size={32}
						icon="menu/action/import"
						text="Import Theme"
						onClick={() => fileInputRef.current?.click()}
					/>
					<Button
						size={32}
						icon="menu/action/copy"
						text="Export JSON"
						onClick={exportThemeJson}
					/>
					<Button
						size={32}
						text="Reset Defaults"
						onClick={resetToDefault}
					/>
					<Button
						color="accent"
						size={32}
						text="Save Theme"
						onClick={saveTheme}
					/>
				</div>
			</div>

			{/* Presets Row */}
			<div className="presetsCard">
				<div className="presetsHeader">
					<Icon name="settings/style" size={16} />
					<span>Quick Color Presets</span>
				</div>
				<div className="presetsList">
					{PRESETS.map(preset => (
						<div
							key={preset.name}
							className={['presetChip', activePreset === preset.name ? 'active' : ''].join(' ')}
							onClick={() => applyColorPreset(preset)}
						>
							<span
								className="presetColorPreview"
								style={{
									background: preset.colors['--color-bg-primary'] || '#171717',
									borderColor: preset.colors['--color-control-accent'] || '#fff',
								}}
							/>
							<div className="presetInfo">
								<span className="presetName">{preset.name}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Live Preview Box */}
			<div className="themeLivePreview">
				<div className="previewHeader">
					<Icon name="sync/globe" size={16} />
					<span>Live Component & Typography Preview</span>
				</div>
				<div className="previewBody">
					<div className="previewCard">
						<div className="previewCardTitle" style={{ fontSize: 'var(--font-size-header1, 24px)' }}>
							Heading 1 Document Title
						</div>
						<div className="previewCardSubtitle" style={{ fontSize: 'var(--font-size-header3, 18px)', color: 'var(--color-text-secondary)' }}>
							Heading 3 Subtitle & Metadata Section
						</div>
						<div className="previewCardDesc" style={{ fontSize: 'var(--font-size-paragraph, 16px)' }}>
							This is a live paragraph showing how typography sizes, line-heights, letter spacing and theme colors render across your workspace.
						</div>
						<div className="previewRow">
							<Input size={28} value="Sample text input field" onChange={() => {}} />
							<Button size={28} color="accent" text="Accent Button" onClick={() => {}} />
							<Button size={28} text="Secondary" onClick={() => {}} />
							<Button size={28} color="red" text="Destructive" onClick={() => {}} />
						</div>
					</div>
				</div>
			</div>

			{/* Category Selector Tabs */}
			<div className="tabs">
				{THEME_CATEGORIES.map((cat, idx) => (
					<div
						key={idx}
						className={['tab', activeCategory === idx ? 'active' : ''].join(' ')}
						onClick={() => setActiveCategory(idx)}
					>
						<span className="label">{cat.title}</span>
					</div>
				))}
			</div>

			{/* Variable Controls Tab Content */}
			<div className="tabContent">
				{isFontTab && (
					<div className="fontTabHeaderCards">
						{/* Quick Font Presets */}
						<div className="presetsCard fontPresetsSection" style={{ marginBottom: '12px' }}>
							<div className="presetsHeader">
								<Icon name="settings/style" size={16} />
								<span>Quick Font Presets</span>
							</div>
							<div className="presetsList">
								{FONT_PRESETS.map(fp => (
									<div
										key={fp.name}
										className={['presetChip', (themeProps['--font-family-base'] === fp.fontFamily || (!themeProps['--font-family-base'] && fp.name.includes('Default'))) ? 'active' : ''].join(' ')}
										onClick={() => applyFontFamily(fp)}
									>
										<span className="presetFontSample" style={{ fontFamily: fp.fontFamily }}>Aa</span>
										<div className="presetInfo">
											<span className="presetName">{fp.name}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Typography Sizing Scales */}
						<div className="presetsCard fontPresetsSection" style={{ marginBottom: '16px' }}>
							<div className="presetsHeader">
								<Icon name="settings/overview" size={16} />
								<span>Typography Sizing Scales</span>
							</div>
							<div className="presetsList">
								{FONT_SCALE_PRESETS.map(sp => (
									<div
										key={sp.name}
										className="presetChip"
										onClick={() => applyFontScale(sp)}
									>
										<div className="presetInfo">
											<span className="presetName">{sp.name}</span>
											<span className="presetDesc" style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>({sp.desc})</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<div className="colorGrid">
					{THEME_CATEGORIES[activeCategory].vars.map(v => {
						const currentValue = themeProps[v.key] !== undefined ? themeProps[v.key] : v.defaultValue;
						const isColor = v.type === 'color';
						const isFontFamily = v.type === 'font-family';
						const isSize = v.type === 'size';

						const hexVal = isColor ? getDisplayColor(v.key, v.defaultValue) : '#222222';
						const numVal = isSize ? (parseFloat(currentValue) || parseFloat(v.defaultValue) || 15) : 0;
						const unit = v.unit || 'px';
						const min = v.min ?? 10;
						const max = v.max ?? 30;
						const step = v.step ?? 0.5;

						const updateSize = (newVal: number) => {
							const clamped = Math.min(max, Math.max(min, newVal));
							const formatted = `${clamped}${unit}`;
							handlePropChange(v.key, formatted);
						};

						return (
							<div key={v.key} className="colorCard">
								<div className="colorCardHeader">
									<div className="colorInfo">
										<div className="colorLabel">{v.label}</div>
										<div className="colorVarKey"><code>{v.key}</code></div>
										<div className="colorDesc">{v.desc}</div>
									</div>
									{isColor && (
										<div className="colorPickerWrapper">
											<input
												type="color"
												className="colorPicker"
												value={hexVal}
												onChange={e => handlePropChange(v.key, e.target.value)}
											/>
										</div>
									)}
								</div>

								<div className="colorInputRow">
									{isFontFamily ? (
										<div className="fontFamilySelectWrapper" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px' }}>
											<select
												className="systemFontSelect"
												value={getActiveFontValue(themeProps['--font-family-base'])}
												onChange={e => {
													const val = e.target.value;
													if (val === 'Inter' || val === "'Inter'" || val === 'default') {
														const next = { ...themeProps };
														delete next['--font-family-base'];
														setThemeProps(next);
														document.documentElement.style.removeProperty('--font-family-base');
														Preview.toastShow({ text: 'Restored default Anytype Inter font' });
													} else {
														const formatted = val.includes(',') ? val : `'${val}', sans-serif`;
														handlePropChange('--font-family-base', formatted);
														Preview.toastShow({ text: `Set font family: ${val.replace(/['",]/g, ' ').trim()}` });
													}
												}}
											>
												<option value="Inter">Inter (Default Anytype)</option>

												<optgroup label="Popular Presets">
													{FONT_PRESETS.filter(p => !p.name.includes('Default')).map(fp => (
														<option key={fp.fontFamily} value={fp.fontFamily}>
															{fp.name}
														</option>
													))}
												</optgroup>

												<optgroup label="System Installed Fonts">
													{systemFonts.filter(f => f !== 'Inter').map(fontName => (
														<option key={fontName} value={fontName}>
															{fontName}
														</option>
													))}
												</optgroup>
											</select>
										</div>
									) : isSize ? (
										<div className="sizeSliderContainer">
											<button
												type="button"
												className="stepBtn"
												onClick={() => updateSize(Number((numVal - step).toFixed(2)))}
												disabled={numVal <= min}
												title="Decrease"
											>
												-
											</button>
											<input
												type="range"
												className="volumeSlider"
												min={min}
												max={max}
												step={step}
												value={numVal}
												onChange={e => updateSize(parseFloat(e.target.value))}
											/>
											<button
												type="button"
												className="stepBtn"
												onClick={() => updateSize(Number((numVal + step).toFixed(2)))}
												disabled={numVal >= max}
												title="Increase"
											>
												+
											</button>
											<div className="sizeValueBadge">
												{numVal}{unit}
											</div>
											{themeProps[v.key] && (
												<div
													className="colorResetBtn"
													onClick={() => {
														const next = { ...themeProps };
														delete next[v.key];
														setThemeProps(next);
														document.documentElement.style.removeProperty(v.key);
													}}
													title="Reset size to default"
												>
													<Icon name="menu/action/remove" size={14} />
												</div>
											)}
										</div>
									) : (
										<>
											<Input
												key={`${v.key}-${currentValue}`}
												size={28}
												value={currentValue}
												placeholder={v.defaultValue}
												onChange={(e, val) => handlePropChange(v.key, val)}
											/>
											{themeProps[v.key] && (
												<div
													className="colorResetBtn"
													onClick={() => {
														const next = { ...themeProps };
														delete next[v.key];
														setThemeProps(next);
														document.documentElement.style.removeProperty(v.key);
													}}
													title="Reset this variable to default"
												>
													<Icon name="menu/action/remove" size={14} />
												</div>
											)}
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
});

export default PageMainSettingsThemeCustomizer;
