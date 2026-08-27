import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Title, Button, Icon, Label, Input } from 'Component';
import * as I from 'Interface';

interface ThemeColorVar {
	key: string;
	label: string;
	desc: string;
	defaultValue: string;
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
			{ key: '--color-bg-primary', label: 'Primary Background', desc: 'Main window and document background', defaultValue: '#171717' },
			{ key: '--color-bg-secondary', label: 'Secondary Background', desc: 'Modal dialogs, popups and dropdowns', defaultValue: '#191919' },
			{ key: '--color-shape-highlight-light-solid', label: 'Sidebar Solid Background', desc: 'Left navigation and vault rail background', defaultValue: '#1e1e1e' },
			{ key: '--color-shape-highlight-light', label: 'Card Surface (Light)', desc: 'Background for cards, tables and panels', defaultValue: 'rgba(255, 255, 255, 0.03)' },
			{ key: '--color-shape-highlight-medium', label: 'Card Surface (Medium)', desc: 'Hover states, chips and secondary surfaces', defaultValue: 'rgba(255, 255, 255, 0.05)' },
			{ key: '--color-shape-highlight-dark', label: 'Card Surface (Dark)', desc: 'Active states, pressed cards and headers', defaultValue: 'rgba(255, 255, 255, 0.11)' },
		],
	},
	{
		title: 'Typography & Text Colors',
		icon: 'settings/style',
		vars: [
			{ key: '--color-text-primary', label: 'Primary Text', desc: 'Main headings, body text and labels', defaultValue: '#e1e1e1' },
			{ key: '--color-text-secondary', label: 'Secondary Text', desc: 'Subtitles, captions and secondary details', defaultValue: '#a3a3a3' },
			{ key: '--color-text-tertiary', label: 'Tertiary / Muted Text', desc: 'Placeholders, timestamps and hints', defaultValue: '#5c5c5c' },
			{ key: '--color-text-inversion', label: 'Inverted Text', desc: 'Text on contrasting buttons or highlights', defaultValue: '#171717' },
		],
	},
	{
		title: 'Borders & Outlines',
		icon: 'settings/storage',
		vars: [
			{ key: '--color-shape-primary', label: 'Primary Border', desc: 'Main container outlines and separators', defaultValue: '#313131' },
			{ key: '--color-shape-secondary', label: 'Secondary Border', desc: 'Card borders, table dividers and inputs', defaultValue: '#292929' },
			{ key: '--color-shape-tertiary', label: 'Tertiary Border', desc: 'Subtle separators and inactive lines', defaultValue: '#232323' },
		],
	},
	{
		title: 'Controls, Buttons & Accents',
		icon: 'sync/globe',
		vars: [
			{ key: '--color-control-accent', label: 'Control Accent', desc: 'Action buttons, active highlights and focus rings', defaultValue: '#d4d4d4' },
			{ key: '--color-control-active', label: 'Control Active', desc: 'Active switches, checkboxes and icons', defaultValue: '#737373' },
			{ key: '--color-control-inactive', label: 'Control Inactive', desc: 'Disabled switches and muted icons', defaultValue: '#414141' },
			{ key: '--color-red', label: 'Destructive / Red', desc: 'Delete buttons, error alerts and warnings', defaultValue: '#f25040' },
			{ key: '--color-blue', label: 'Accent Blue', desc: 'Links and informational highlights', defaultValue: '#6878ee' },
			{ key: '--color-purple', label: 'Accent Purple', desc: 'Tags and special badges', defaultValue: '#c870e8' },
		],
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

export const applyThemeToDocument = (colors: Record<string, string>) => {
	const root = document.documentElement;
	Object.entries(colors).forEach(([key, val]) => {
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

	const [colors, setColors] = useState<Record<string, string>>(() => {
		return loadStoredTheme();
	});

	const [activeCategory, setActiveCategory] = useState<number>(0);
	const [activePreset, setActivePreset] = useState<string>('');

	useEffect(() => {
		applyThemeToDocument(colors);
	}, [colors]);

	const handleColorChange = (key: string, value: string) => {
		const next = { ...colors, [key]: value };
		setColors(next);
		applyThemeToDocument(next);
	};

	const applyPreset = (preset: typeof PRESETS[0]) => {
		setActivePreset(preset.name);
		setColors(preset.colors);
		applyThemeToDocument(preset.colors);
		Preview.toastShow({ text: `Applied "${preset.name}" theme preset` });
	};

	const saveTheme = () => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
			Preview.toastShow({ text: 'Theme customization saved successfully' });
		} catch (e: any) {
			Preview.toastShow({ icon: 'notice', text: `Failed to save theme: ${e.message}` });
		}
	};

	const resetToDefault = () => {
		localStorage.removeItem(STORAGE_KEY);
		setColors({});
		setActivePreset('');
		// Remove inline style properties from root
		const root = document.documentElement;
		THEME_CATEGORIES.forEach(cat => {
			cat.vars.forEach(v => {
				root.style.removeProperty(v.key);
			});
		});
		Preview.toastShow({ text: 'Reset all colors to Anytype default theme' });
	};

	const exportThemeJson = () => {
		const payload = {
			name: activePreset || 'Custom Anytype Theme',
			version: '1.0',
			colors,
		};
		U.Common.clipboardCopy({ text: JSON.stringify(payload, null, 2) });
		Preview.toastShow({ text: 'Theme JSON copied to clipboard' });
	};

	const importThemeJson = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);
				const importedColors = parsed.colors || parsed;
				if (importedColors && typeof importedColors === 'object') {
					setColors(importedColors);
					applyThemeToDocument(importedColors);
					Preview.toastShow({ text: `Imported theme from ${file.name}` });
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

	// Convert rgba or complex value to a simple hex for input[type=color] if possible
	const getDisplayColor = (key: string, defaultValue: string): string => {
		const current = colors[key] || defaultValue;
		if (current.startsWith('#') && (current.length === 7 || current.length === 4)) {
			return current;
		}
		return '#222222';
	};

	return (
		<div className="pageSettingsThemeCustomizer">
			<div className="titleWrapper">
				<div>
					<Title text="Theme Customizer" />
					<div className="titleSub">Customize component colors, backgrounds, borders, and typography palette.</div>
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
					<span>Quick Theme Presets</span>
				</div>
				<div className="presetsList">
					{PRESETS.map(preset => (
						<div
							key={preset.name}
							className={['presetChip', activePreset === preset.name ? 'active' : ''].join(' ')}
							onClick={() => applyPreset(preset)}
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
					<span>Live Component Preview</span>
				</div>
				<div className="previewBody">
					<div className="previewCard">
						<div className="previewCardTitle">Sample Component Card</div>
						<div className="previewCardDesc">This is how your interface components, text, inputs and buttons render in real-time.</div>
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

			{/* Color Variable Controls */}
			<div className="tabContent">
				<div className="colorGrid">
					{THEME_CATEGORIES[activeCategory].vars.map(v => {
						const currentValue = colors[v.key] !== undefined ? colors[v.key] : v.defaultValue;
						const hexVal = getDisplayColor(v.key, v.defaultValue);

						return (
							<div key={v.key} className="colorCard">
								<div className="colorCardHeader">
									<div className="colorInfo">
										<div className="colorLabel">{v.label}</div>
										<div className="colorVarKey"><code>{v.key}</code></div>
										<div className="colorDesc">{v.desc}</div>
									</div>
									<div className="colorPickerWrapper">
										<input
											type="color"
											className="colorPicker"
											value={hexVal}
											onChange={e => handleColorChange(v.key, e.target.value)}
										/>
									</div>
								</div>

								<div className="colorInputRow">
									<Input
										size={28}
										value={currentValue}
										placeholder={v.defaultValue}
										onChange={(e, val) => handleColorChange(v.key, val)}
									/>
									{colors[v.key] && (
										<div
											className="colorResetBtn"
											onClick={() => {
												const next = { ...colors };
												delete next[v.key];
												setColors(next);
												document.documentElement.style.removeProperty(v.key);
											}}
											title="Reset this variable to default"
										>
											<Icon name="menu/action/remove" size={14} />
										</div>
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
