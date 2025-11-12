export default {
	icon: {
		text: {
			grey: '#e3e3e3',
			yellow: '#f4eb91',
			orange: '#fcdc9c',
			red: '#fcd1c3',
			pink: '#f8c2e5',
			purple: '#e8d0f1',
			blue: '#cbd2fa',
			ice: '#b2dff9',
			teal: '#a9ebe6',
			lime: '#c5efa3',
		},
		bg: {
			grey: '#949494',
			yellow: '#ecd91b',
			orange: '#ffb522',
			red: '#f55522',
			pink: '#e51ca0',
			purple: '#ab50cc',
			blue: '#3e58eb',
			ice: '#2aa7ee',
			teal: '#0fc8ba',
			lime: '#5dd400',
		},

		list: [ 'grey', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'ice', 'teal', 'lime' ],
	},

	/* ----------------------------------------------------------- */

	'': {

		error: '#000',
		iconDefault: 'rgba(0,0,0,0.11)',
		textInversion: '#fff',

		color: {
			default: '#252525',
			grey: '#b6b6b6',
			yellow: '#ecd91b',
			orange: '#ffb522',
			red: '#f55522',
			pink: '#e51ca0',
			purple: '#ab50cc',
			blue: '#3e58eb',
			ice: '#2aa7ee',
			teal: '#0fc8ba',
			lime: '#5dd400',
		},

		graph: {
			bg: '#fff',
			link: '#dfddd0',
			arrow: '#b6b6b6',
			node: '#b6b6b6',
			text: '#b6b6b6',
			highlight: '#ffb522',
			selected: '#2aa7ee',
			iconBg: '#000'
		},

		mermaid: {
			fontFamily: 'Helvetica, Arial, sans-serif',
			fontSize: '14px'
		},

		qr: {
			foreground: '#000',
			bg: '#fff'
		},

		iconUser: '#b6b6b6',

		progress: {
			bg: '#ebebeb',
			fg: '#ffd15b',
		},

		sparkOnboarding: {
			node: {
				type: {
					fill: 'hsla(155, 76%, 57%, 1)', // Green for type nodes (original)
					stroke: 'hsla(155, 76%, 47%, 1)',
					text: 'rgba(0, 0, 0, 0.85)', // Dark text for light mode
					textShadow: 'rgba(255, 255, 255, 0.9)', // White shadow for contrast
					glow: 'hsla(155, 76%, 90%, 0.4)', // Light green glow for types
				},
				object: {
					fill: 'hsla(201, 100%, 75%, 1)', // Blue for object nodes (original)
					stroke: 'hsla(201, 100%, 65%, 1)',
					text: 'rgba(0, 0, 0, 0.85)', // Dark text for light mode
					textShadow: 'rgba(255, 255, 255, 0.9)', // White shadow for contrast
					glow: 'hsla(201, 100%, 92%, 0.4)', // Light blue glow for objects
				},
				space: {
					fill: 'hsla(201, 100%, 75%, 1)', // Blue for space nodes (same as objects in original)
					stroke: 'hsla(201, 100%, 65%, 1)',
					text: 'rgba(0, 0, 0, 0.85)', // Dark text for light mode
					textShadow: 'rgba(255, 255, 255, 0.9)', // White shadow for contrast
					glow: 'hsla(201, 100%, 92%, 0.4)', // Light blue glow for spaces
				},
			},
			link: {
				stroke: 'rgba(160, 160, 160, 0.4)', // Light gray
				strokeHover: 'rgba(120, 120, 120, 0.6)', // Darker gray on hover
			},
			canvas: {
				background: 'rgba(248, 248, 250, 0.98)', // Light gray background
				nodeCenter: 'rgba(255, 255, 255, 1)', // White center for nodes
				nodeGlow: 'hsla(155, 76%, 74%, 0.3)', // Default green glow
			},
		}
	},

	dark: {

		error: '#fff',
		iconDefault: 'rgba(255,255,255,0.11)',
		textInversion: '#171717',

		color: {
			default: '#f8f8f8',
			grey: '#737373',
			yellow: '#ecd91b',
			orange: '#ffb522',
			red: '#f55522',
			pink: '#e51ca0',
			purple: '#ab50cc',
			blue: '#3e58eb',
			ice: '#2aa7ee',
			teal: '#0fc8ba',
			lime: '#5dd400',
		},

		graph: {
			bg: '#171717',
			link: '#3f3f3f',
			arrow: '#555',
			node: '#ababab',
			text: '#ababab',
			highlight: '#ffb522',
			selected: '#2aa7ee',
			iconBg: '#252525'
		},

		mermaid: {
			fontFamily: 'Helvetica, Arial, sans-serif',
			fontSize: '14px',
			primaryColor: '#bb2528',
			primaryTextColor: '#fff',
			primaryBorderColor: '#7c0000',
			lineColor: '#F8b229',
			secondaryColor: '#006100',
			tertiaryColor: '#fff'
		},

		qr: {
			foreground: '#000',
			bg: '#fff'
		},

		iconUser: '#ababab',

		progress: {
			bg: '#292929',
			fg: '#ffd15b',
		},

		sparkOnboarding: {
			node: {
				type: {
					fill: 'rgba(100, 180, 120, 0.85)', // Bright vivid green like "Supply"
					stroke: 'rgba(80, 160, 100, 0.9)',
					text: 'rgba(220, 220, 220, 0.95)', // Very bright text
					textShadow: '0 2px 4px rgba(0, 0, 0, 1)', // Strong shadow for contrast
					glow: 'rgba(100, 180, 120, 0.15)', // Weak green glow
				},
				object: {
					fill: 'rgba(100, 150, 200, 0.85)', // Bright vivid blue like "Work"
					stroke: 'rgba(80, 130, 180, 0.9)',
					text: 'rgba(220, 220, 220, 0.95)',
					textShadow: '0 2px 4px rgba(0, 0, 0, 1)',
					glow: 'rgba(100, 150, 200, 0.15)', // Weak blue glow
				},
				space: {
					fill: 'rgba(100, 150, 200, 0.85)', // Same bright blue for spaces
					stroke: 'rgba(80, 130, 180, 0.9)',
					text: 'rgba(220, 220, 220, 0.95)',
					textShadow: '0 2px 4px rgba(0, 0, 0, 1)',
					glow: 'rgba(100, 150, 200, 0.15)', // Weak blue glow
				},
			},
			link: {
				stroke: 'rgba(120, 120, 120, 0.5)', // Brighter links
				strokeHover: 'rgba(160, 160, 160, 0.7)', // Brighter hover
			},
			canvas: {
				background: '#1F1F1F',
				grid: '#333333',
				nodeCenter: 'rgba(40, 40, 40, 0.95)', // Darker center for contrast
				nodeGlow: 'rgba(80, 100, 140, 0.1)', // Very weak general glow
			},
		}
	}

};
