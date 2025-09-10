// Spark Onboarding Constants

import theme from 'json/theme';

// Graph visualization
export const GRAPH_CONFIG = {
	MAX_NODES: 50,
	NODE_RADIUS: 220,
	NODE_RADIUS_VARIANCE: 40,
	TYPE_NODE_OPACITY: 0.9,
	OBJECT_NODE_OPACITY: 0.7,
	LINK_OPACITY: 0.6,
} as const;

// UI dimensions
export const UI_CONFIG = {
	POPUP_WIDTH: 720,
	POPUP_HEIGHT: 680,
	SAFE_MARGIN: 100,
	MIN_HORIZONTAL_SPACE: 250,
	EDGE_MARGIN: 100,
} as const;

// Animation timings (ms)
export const ANIMATION_CONFIG = {
	NODE_FADE_IN_DELAY: 300,
	NODE_FADE_IN_DURATION: 600,
	LINK_FADE_IN_DELAY: 500,
	LINK_FADE_IN_DURATION: 400,
} as const;

// Validation
export const VALIDATION_CONFIG = {
	MIN_GOAL_LENGTH: 3,
	VALID_GOAL_LENGTH: 10, // For isValid computed property
} as const;

// Network
export const NETWORK_CONFIG = {
	MAX_RECONNECT_ATTEMPTS: 3,
	RECONNECT_BASE_DELAY: 1000,
	MAX_RECONNECT_DELAY: 10000,
	SESSION_TIMEOUT_MINUTES: 20,
} as const;

// Logging
export const LOG_CONFIG = {
	ENABLE_DEBUG_LOGS: false,
	REDACT_SESSION_IDS: true,
	LOG_PREFIX: '[SparkOnboarding]',
} as const;

// Get graph colors from theme based on current theme mode
export function getGraphColors(isDarkMode: boolean = false) {
	const themeColors = isDarkMode ? theme.dark : theme[''];
	return themeColors.sparkOnboarding;
}

// Graph node visual configuration factory
export function getNodeStyleConfig(isDarkMode: boolean = false) {
	const colors = getGraphColors(isDarkMode);
	
	return {
		type: {
			radius: 12,
			fontSize: 14,
			fontWeight: '600',
			opacity: GRAPH_CONFIG.TYPE_NODE_OPACITY,
			color: colors.node.type,
		},
		object: {
			radius: 10,
			fontSize: 12,
			fontWeight: '400',
			opacity: GRAPH_CONFIG.OBJECT_NODE_OPACITY,
			color: colors.node.object,
		},
		space: {
			radius: 14,
			fontSize: 16,
			fontWeight: '700',
			opacity: 1,
			color: colors.node.space,
		},
	};
}

// Get node style configuration by type
export function getNodeStyle(nodeType: 'type' | 'object' | 'space', isDarkMode: boolean = false) {
	const config = getNodeStyleConfig(isDarkMode);
	return config[nodeType] || config.object;
}