export default {
	editor: 704,
	blockMenu: 48,
	lastBlock: 80,
	menuBorder: 10,
	header: 44,

	history: {
		panel: 348,
	},

	sidebar: {
		default: { min: 240, max: 480, default: 336, threshold: 72 },
		left: { min: 92, max: 480, default: 284 }
	},

	vaultBreakpoints: [ 336, 284, 92, 0 ],
	vaultStripeMaxWidth: 128,

	table: {
		min: 50,
		max: 2000,
		default: 140,
	},

	menu: {
		value: 288,
	},

	dataview: {
		gallery: {
			width: 224,
			height: 72,
			margin: 16,
			padding: 16,
		},

		board: {
			card: 262,
			margin: 8
		},

		cell: {
			default: 192,
			format1: 500,

			min: 48,
			max: 1000,
			edit: 300,
			icon: 70,
		},
	},

	store: {
		width: 300,
		margin: 32,
		border: 80,
	}
};
