/**
 * Onboarding Graph Worker - Customized version with blocking areas and radial gradient nodes
 * Based on the original graph.js worker but with:
 * 1. Blocking/restricted areas where nodes cannot enter
 * 2. Radial gradient node rendering (transparent center, colored edges)
 * 3. Customizable node styling
 * 4. Simplified for onboarding use case
 */

importScripts(
	'./lib/d3/d3-quadtree.min.js',
	'./lib/d3/d3-zoom.min.js',
	'./lib/d3/d3-drag.min.js',
	'./lib/d3/d3-dispatch.min.js',
	'./lib/d3/d3-timer.min.js',
	'./lib/d3/d3-selection.min.js',
	'./lib/d3/d3-force.min.js',
	'./lib/d3/d3-force-cluster.min.js',
	'./lib/tween.js',
	'./lib/util.js'
);

const util = new Util();

// CONSTANTS
const transformThreshold = 0.5; // Lower threshold to show labels more often
const transformThresholdHalf = transformThreshold / 2;

const EdgeType = {
	Link: 0,
	Relation: 1,
};

const forceProps = {
	center: {
		x: 0.5,
		y: 0.5,
	},
	charge: {
		strength: -250,
		distanceMax: 1000,
	},
	link: {
		distance: 100,
	},
	forceX: {
		strength: 0.01,
		x: 0.5,
	},
	forceY: {
		strength: 0.01,
		y: 0.5,
	},
};

// Custom node styling configuration
const nodeStyle = {
	defaultRadius: 25, // 50px diameter
	centerOpacity: 1,  // Opaque center
	edgeOpacity: 0.8,  // Visible edge
	centerColor: 'rgba(255, 255, 255, 1)', // White center to hide edges underneath
	edgeColor: 'rgba(184, 166, 232, 0.8)',
	glowColor: 'rgba(184, 166, 232, 0.05)',
	glowRadius: 40, // Increased from 35 to 75 (more than double for better effect)
};

// Blocking areas configuration
let blockingAreas = [];

let canvas = null;
let data = { nodes: [], edges: [], colors: {}, settings: {} };
let ctx = null;
let width = 0;
let height = 0;
let density = 0;
let transform = { k: 1, x: 0, y: 0 }; // Initialize with default values
let nodes = [];
let edges = [];
let images = {};
let simulation = null;
let frame = 0;
let selected = [];
let settings = {};
let time = 0;
let isHovering = false;
let edgeMap = new Map();
let nodeMap = new Map();
let hoverAlpha = 0.3;
let fontFamily = 'Inter, -apple-system, sans-serif';
let timeoutHover = 0;
let rootId = '';
let root = null;
let paused = false;
let isOver = '';
let maxDegree = 0;
let clusters = {};
let selectBox = { x: 0, y: 0, width: 0, height: 0 };
let borderRadius = 0;
let lineWidth = 0;
let lineWidth3 = 0;

// Drag state
let isDragging = false;
let dragNode = null;
let dragOffset = { x: 0, y: 0 };

// Tick counter for debugging
let tickCount = 0;

addEventListener('message', ({ data }) => { 
	if (this[data.id]) {
		this[data.id](data); 
	};
});

/**
 * Registers an image bitmap for a given source.
 * @param {{src: string, bitmap: ImageBitmap}} param - Image source and bitmap.
 */
image = ({ src, bitmap }) => {
	console.log('[Worker] Received image (handler 1):', src, 'bitmap:', bitmap);
	if (!images[src]) {
		images[src] = bitmap;
		console.log('[Worker] Stored image:', src, 'total images:', Object.keys(images).length);
		redraw();
	} else {
		console.log('[Worker] Image already exists:', src);
	}
};

/**
 * Initializes the graph worker with blocking areas support
 */
init = (param) => {
	// Merge param into data, preserving defaults
	data = Object.assign(data, param);
	canvas = param.canvas;
	settings = param.settings || {};
	rootId = param.rootId || '';
	ctx = canvas.getContext('2d');
	
	// Ensure colors are set
	if (!data.colors) {
		data.colors = {
			bg: 'transparent',
			text: 'rgba(255, 255, 255, 0.9)',
			node: 'rgba(184, 166, 232, 0.8)',
			link: 'rgba(184, 166, 232, 0.3)',
			arrow: 'rgba(184, 166, 232, 0.5)',
			highlight: 'rgba(255, 255, 255, 0.9)',
			selected: 'rgba(255, 200, 100, 0.8)',
		};
	}
	
	edges = param.edges ? util.objectCopy(param.edges) : [];
	nodes = param.nodes ? util.objectCopy(param.nodes) : [];
	
	// Initialize blocking areas if provided
	if (param.blockingAreas) {
		blockingAreas = param.blockingAreas;
	}
	
	// Override node style if provided
	if (param.nodeStyle) {
		Object.assign(nodeStyle, param.nodeStyle);
	}

	util.ctx = ctx;
	resize(param);
	initTheme(param.theme || 'dark');
	initFonts();
	recalcConstants();

	ctx.lineCap = 'round';
	ctx.fillStyle = data.colors.bg || 'transparent';
	
	transform = d3.zoomIdentity.translate(0, 0).scale(1);
	simulation = d3.forceSimulation(nodes);
	simulation.alpha(1);
	simulation.alphaDecay(0.02); // Moderate decay
	simulation.velocityDecay(0.6); // Balanced damping - allows movement but prevents runaway

	initForces();

	// Reset tick counter
	tickCount = 0;
	// Simplified logging - no force tracking interference
	
	simulation.on('tick', () => {
		tickCount++;
		
		// Apply gentle force to pull nodes away from edges (30px margin)
		nodes.forEach(node => {
			const margin = 30;
			const forceFactor = 0.1; // Gentle force
			
			// Don't hard-clamp positions, just apply forces
			// Left edge
			if (node.x < margin) {
				const distance = margin - node.x;
				node.vx += distance * forceFactor;
			}
			// Right edge
			if (node.x > width - margin) {
				const distance = node.x - (width - margin);
				node.vx -= distance * forceFactor;
			}
			// Top edge
			if (node.y < margin) {
				const distance = margin - node.y;
				node.vy += distance * forceFactor;
			}
			// Bottom edge
			if (node.y > height - margin) {
				const distance = node.y - (height - margin);
				node.vy -= distance * forceFactor;
			}
		});
		
		applyBlockingForces();
		
		redraw();
	});
	simulation.tick(50); // Fewer initial ticks to prevent drift buildup

	root = getNodeById(rootId);

	const x = root ? root.x : width / 2;
	const y = root ? root.y : height / 2;

	transform = Object.assign(transform, getCenter(x, y));
	send('onTransform', { ...transform });
};

/**
 * Sets or updates blocking areas
 */
setBlockingAreas = (param) => {
	blockingAreas = param.areas || [];
	if (simulation) {
		simulation.alpha(0.3).restart();
	}
};

/**
 * Sets the graph data (nodes and edges)
 */
setData = (param) => {
	// Store the new data
	data.nodes = param.nodes || [];
	data.edges = param.edges || [];
	
	// Keep existing node positions if they exist
	const existingPositions = {};
	nodes.forEach(node => {
		if (node.id && node.x !== undefined && node.y !== undefined) {
			existingPositions[node.id] = { x: node.x, y: node.y, vx: node.vx || 0, vy: node.vy || 0 };
		}
	});
	
	// Copy to working arrays
	nodes = data.nodes ? util.objectCopy(data.nodes) : [];
	
	// Validate edges - only include edges where both source and target nodes exist
	const nodeIds = new Set(nodes.map(n => n.id));
	edges = data.edges ? data.edges.filter(edge => {
		const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
		const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
		const isValid = nodeIds.has(sourceId) && nodeIds.has(targetId);
		if (!isValid) {
			console.log('Worker: Skipping invalid edge:', sourceId, '->', targetId);
		}
		return isValid;
	}) : [];
	edges = util.objectCopy(edges);
	
	// Restore positions for existing nodes
	nodes.forEach(node => {
		if (existingPositions[node.id]) {
			node.x = existingPositions[node.id].x;
			node.y = existingPositions[node.id].y;
			node.vx = existingPositions[node.id].vx;
			node.vy = existingPositions[node.id].vy;
		}
	});

	// Ensure nodes have initial positions - but make sure they start OUTSIDE the blocking area
	if (blockingAreas.length > 0) {
		const area = blockingAreas[0];
		const leftSpace = area.x;
		const rightSpace = width - (area.x + area.width);
		const topSpace = area.y;
		const bottomSpace = height - (area.y + area.height);

		const horizontalSpace = Math.max(leftSpace, rightSpace);
		const verticalSpace = Math.max(topSpace, bottomSpace);
		const useHorizontal = horizontalSpace > verticalSpace;
		
		console.log('Worker: Using horizontal placement:', useHorizontal);
		
		// Calculate safe zones for node placement
		const minSafeDistance = 50; // Minimum distance from popup edge
		
		nodes.forEach((node, index) => {
			// Check if node already has a valid position
			const hasValidPosition = node.x !== undefined && node.x !== null && node.y !== undefined && node.y !== null;
			
			if (hasValidPosition) {
				// Skip repositioning for nodes that already have valid positions
				// They will be handled by the blocking forces if needed
			} else {
				// No predefined position, distribute evenly
				if (useHorizontal) {
					// Distribute on left and right sides
					const side = index % 2 === 0 ? 'left' : 'right';
					const sideIndex = Math.floor(index / 2);
					const nodesPerSide = Math.ceil(nodes.length / 2);
					
					if (side === 'left') {
						// Left side: place to the left of the popup
						// Calculate available space to the left
						const availableSpace = Math.min(leftSpace - minSafeDistance - 20, 150); // Leave 20px from screen edge
						const randomDepth = Math.random() * Math.max(0, availableSpace); // Only positive values
						
						// Position: start at safe distance, then go further left by randomDepth
						node.x = area.x - minSafeDistance - randomDepth;
						
						// Distribute vertically with slight randomness
						const verticalSpacing = height / (nodesPerSide + 1);
						const baseY = verticalSpacing * (sideIndex + 1);
						// Ensure we never go below margin of 30
						node.y = Math.max(30, Math.min(height - 30, baseY + (Math.random() - 0.5) * 20))
					} else {
						// Right side: place to the right of the popup
						// Calculate available space to the right
						const availableSpace = Math.min(rightSpace - minSafeDistance - 20, 150);
						const randomDepth = Math.random() * Math.max(0, availableSpace); // Only positive values
						
						// Position: start at safe distance, then go further right by randomDepth
						node.x = area.x + area.width + minSafeDistance + randomDepth;
						
						// Distribute vertically with slight randomness
						const verticalSpacing = height / (nodesPerSide + 1);
						const baseY = verticalSpacing * (sideIndex + 1);
						// Ensure we never go below margin of 30
						node.y = Math.max(30, Math.min(height - 30, baseY + (Math.random() - 0.5) * 20))
					}
				} else {
					// Distribute on top and bottom
					const side = index % 2 === 0 ? 'top' : 'bottom';
					const sideIndex = Math.floor(index / 2);
					const nodesPerSide = Math.ceil(nodes.length / 2);
					
					if (side === 'top') {
						// Top side: distribute within available space
						const availableHeight = topSpace - minSafeDistance - 50;
						const randomDepth = Math.random() * Math.min(availableHeight, 150);
						node.y = area.y - minSafeDistance - randomDepth;
						
						// Distribute horizontally with some randomness
						const horizontalSpacing = width / (nodesPerSide + 1);
						const baseX = horizontalSpacing * (sideIndex + 1);
						node.x = baseX + (Math.random() - 0.5) * Math.min(horizontalSpacing * 0.3, 50);
					} else {
						// Bottom side: distribute within available space
						const availableHeight = bottomSpace - minSafeDistance - 50;
						const randomDepth = Math.random() * Math.min(availableHeight, 150);
						node.y = area.y + area.height + minSafeDistance + randomDepth;
						
						// Distribute horizontally with some randomness
						const horizontalSpacing = width / (nodesPerSide + 1);
						const baseX = horizontalSpacing * (sideIndex + 1);
						node.x = baseX + (Math.random() - 0.5) * Math.min(horizontalSpacing * 0.3, 50);
					}
				}
			}
			// Keep initial velocity at zero
			node.vx = 0;
			node.vy = 0;
		});
	}
	
	// Reinitialize or update simulation
	if (simulation) {
		// Update existing simulation with new nodes
		simulation.nodes(nodes);
		// Moderate restart
		simulation.alpha(0.3).restart(); // Moderate alpha
	} else {
		// Create new simulation with the nodes
		simulation = d3.forceSimulation(nodes);
		simulation.alpha(0.5); // Moderate initial setup
		simulation.alphaDecay(0.02); // Moderate decay
		simulation.velocityDecay(0.6); // Balanced damping - allows movement but prevents runaway
	}
	
	// Apply blocking forces first to ensure nodes are in safe positions
	applyBlockingForces();
	
	// Only initialize forces if this is a new simulation
	if (!simulation.on('tick')) {
		initForces();
		
		simulation.on('tick', () => {
			// Apply gentle force to pull nodes away from edges (30px margin)
			nodes.forEach(node => {
				const margin = 30;
				const forceFactor = 0.1; // Gentle force
				
				// Don't hard-clamp positions, just apply forces
				// Left edge
				if (node.x < margin) {
					const distance = margin - node.x;
					node.vx += distance * forceFactor;
				}
				// Right edge
				if (node.x > width - margin) {
					const distance = node.x - (width - margin);
					node.vx -= distance * forceFactor;
				}
				// Top edge
				if (node.y < margin) {
					const distance = margin - node.y;
					node.vy += distance * forceFactor;
				}
				// Bottom edge
				if (node.y > height - margin) {
					const distance = node.y - (height - margin);
					node.vy -= distance * forceFactor;
				}
			});
			applyBlockingForces();
			redraw();
		});
	} else {
		// Update the link force with new edges and ensure distance is set
		if (simulation.force('link')) {
			simulation.force('link')
				.links(edges)
				.distance(100) // Ensure distance is always 100px
				.strength(1.0) // Strong force
				.iterations(10); // Many iterations for precision
		}
	}
	
	redraw();
};

/**
 * Applies repulsive forces to keep nodes out of blocking areas
 */
applyBlockingForces = () => {
	if (!blockingAreas.length) return;
	
	// Always apply blocking forces to keep nodes out
	
	nodes.forEach(node => {
		// Ensure node has position
		if (node.x === undefined) node.x = Math.random() * width;
		if (node.y === undefined) node.y = Math.random() * height;
		
		blockingAreas.forEach(area => {
			const nodeX = node.x;
			const nodeY = node.y;
			const nodeRadius = 30; // Use fixed radius for blocking calculation
			
			// CRITICAL FIX: Convert blocking area from screen space to simulation space
			// Screen coords to simulation coords: (screen - translation) / scale
			const simAreaX = (area.x - transform.x) / transform.k;
			const simAreaY = (area.y - transform.y) / transform.k;
			const simAreaWidth = area.width / transform.k;
			const simAreaHeight = area.height / transform.k;
			
			// Check if node center is inside the blocking area (with buffer) - now in same coordinate space
			const buffer = 30 / transform.k; // Buffer also needs to be in simulation space
			const isInside = nodeX > (simAreaX - buffer) && 
							 nodeX < (simAreaX + simAreaWidth + buffer) &&
							 nodeY > (simAreaY - buffer) && 
							 nodeY < (simAreaY + simAreaHeight + buffer);
			
			if (isInside) {
				// Calculate center of blocking area (in simulation space)
				const simCenterX = simAreaX + simAreaWidth / 2;
				const simCenterY = simAreaY + simAreaHeight / 2;
				
				// Calculate available space on each side (in simulation space)
				const simWidth = width / transform.k;
				const simHeight = height / transform.k;
				const leftSpace = simAreaX;
				const rightSpace = simWidth - (simAreaX + simAreaWidth);
				const topSpace = simAreaY;
				const bottomSpace = simHeight - (simAreaY + simAreaHeight);
				
				// Determine best direction based on available space
				const horizontalSpace = Math.max(leftSpace, rightSpace);
				const verticalSpace = Math.max(topSpace, bottomSpace);
				
				let targetX, targetY;
				
				// Calculate safe target position (in simulation space)
				const minSafeDistance = 50 / transform.k; // Convert to simulation space
				
				// Choose direction with more space
				if (horizontalSpace > verticalSpace) {
					// Push to sides (we have more horizontal space)
					if (nodeX < simCenterX) {
						// Push to left - fixed position, no randomness
						targetX = simAreaX - minSafeDistance - 30 / transform.k; // Fixed offset in sim space
						targetY = nodeY; // Keep Y unchanged
					} else {
						// Push to right - fixed position, no randomness
						targetX = simAreaX + simAreaWidth + minSafeDistance + 30 / transform.k; // Fixed offset in sim space
						targetY = nodeY; // Keep Y unchanged
					}
				} else {
					// Push to top/bottom (we have more vertical space)
					if (nodeY < simCenterY) {
						// Push to top - fixed position, no randomness
						targetX = nodeX; // Keep X unchanged
						targetY = simAreaY - minSafeDistance - 30 / transform.k; // Fixed offset in sim space
					} else {
						// Push to bottom - fixed position, no randomness
						targetX = nodeX; // Keep X unchanged
						targetY = simAreaY + simAreaHeight + minSafeDistance + 30 / transform.k; // Fixed offset in sim space
					}
				}
				
				// Apply force towards target position
				const dx = targetX - nodeX;
				const dy = targetY - nodeY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance > 5) { // Apply force only if significantly inside
					// Moderate force to gently push nodes out
					const force = Math.min(2, distance * 0.1); // Gentler, consistent force
					
					node.vx = (node.vx || 0) + (dx / distance) * force;
					node.vy = (node.vy || 0) + (dy / distance) * force;
				}
			}
		});
	});
};

/**
 * Custom force initialization with blocking area consideration
 */
initForces = () => {
	const { charge, link } = forceProps;
	
	updateOrphans();

	nodes.forEach(d => {
		if (d.typeKey && !clusters[d.typeKey]) {
			clusters[d.typeKey] = { id: d.typeKey, radius: 0, x: 0, y: 0 };
		};
	});

	clusters = Object.values(clusters);

	// No monitoring interference
	
	// Initialize simulation with basic forces
	simulation
		.force('charge', d3.forceManyBody()
			.strength(-10) // Minimal repulsion
			.distanceMax(50) // Very limited range
			.theta(0.9)) // Higher theta for more accurate force calculation
		.force('collide', d3.forceCollide(d => {
			// Use actual node radius to prevent overlap
			const baseRadius = getRadius(d);
			return baseRadius + 10; // Small buffer to prevent visual overlap
		}).strength(0.8)); // Good strength to prevent overlap

	// Initialize link force properly with edges
	if (edges && edges.length > 0) {
		const linkForce = d3.forceLink(edges)
			.id(d => d.id)
			.distance(100) // 100px distance for all links
			.strength(0.9) // Strong force to maintain distance
			.iterations(5); // Many iterations for precision
		
		simulation.force('link', linkForce);
	} else {
		// Create empty link force that can be updated later
		simulation.force('link', d3.forceLink([]).id(d => d.id));
	}

	updateForces();
	redraw();
};

/**
 * Draw function with radial gradient nodes and blocking area visualization
 */
draw = (t) => {
	const radius = 5.7 / transform.k;

	recalcConstants();

	time = t;
	TWEEN.update();

	ctx.save();
	ctx.clearRect(0, 0, width, height);
	
	// Reset globalAlpha to ensure clean state
	ctx.globalAlpha = 1;
	
	ctx.translate(transform.x, transform.y);
	ctx.scale(transform.k, transform.k);
	ctx.font = getFont();
	
	// Debug: Draw blocking areas (remove in production)
	if (blockingAreas.length && settings.showBlockingAreas) {
		ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
		ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
		ctx.lineWidth = 2 / transform.k;
		
		blockingAreas.forEach(area => {
			ctx.fillRect(area.x, area.y, area.width, area.height);
			ctx.strokeRect(area.x, area.y, area.width, area.height);
		});
	}

	// Draw edges - ALWAYS at full opacity, before nodes
	const currentAlpha = ctx.globalAlpha;
	ctx.globalAlpha = 1; // Force full opacity for edges
	
	// Draw ALL edges, not just those in viewport - edges should always be visible
	edges.forEach(d => {
		// Get actual nodes for source and target (handle both object and ID references)
		let sourceNode = typeof d.source === 'object' ? d.source : getNodeById(d.source);
		let targetNode = typeof d.target === 'object' ? d.target : getNodeById(d.target);
		
		// Ensure both nodes exist and have valid positions
		if (sourceNode && targetNode && 
		    !isNaN(sourceNode.x) && !isNaN(sourceNode.y) && 
		    !isNaN(targetNode.x) && !isNaN(targetNode.y)) {
			// Always draw the edge, no viewport checking for edges
			drawEdge({ source: sourceNode, target: targetNode }, radius, radius * 1.3, settings.marker && d.isDouble, settings.marker);
		}
	});
	
	ctx.globalAlpha = currentAlpha; // Restore alpha for nodes

	// Draw nodes with radial gradient
	let drawnNodes = [];
	let skippedNodes = [];
	nodes.forEach(d => {
		// Always draw nodes that are being dragged, or check viewport
		if (isDragging && dragNode && d.id === dragNode.id) {
			drawRadialNode(d);
			drawnNodes.push(d.id);
		} else if (checkNodeInViewport(d)) {
			drawRadialNode(d);
			drawnNodes.push(d.id);
		} else {
			skippedNodes.push(d.id);
		}
	});

	if (selectBox.x && selectBox.y && selectBox.width && selectBox.height) {
		drawSelectBox();
	};

	ctx.restore();
};


/**
 * Draws a node with radial gradient effect
 */
drawRadialNode = (d) => {
	const radius = d.customRadius || nodeStyle.defaultRadius;
	// Ensure valid coordinates
	const x = isNaN(d.x) ? 0 : (d.x || 0);
	const y = isNaN(d.y) ? 0 : (d.y || 0);
	const isSelected = selected.includes(d.id);
	const io = isOver == d.id;
	
	// Save the current alpha
	const savedAlpha = ctx.globalAlpha;
	
	// Adjust opacity for hovering
	if (isHovering && !io) {
		ctx.globalAlpha = hoverAlpha;
	}
	
	// Draw outer glow for hover/selected states
	if (io || isSelected || (root && d.id === root.id)) {
		const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, nodeStyle.glowRadius);
		// Create a lighter version of the edge color for glow
		let lightGlowColor;
		if (d.type === 'type') {
			// Light green glow for types
			lightGlowColor = 'hsla(155, 76%, 90%, 0.4)'; // Very light green with some opacity
		} else {
			// Light blue glow for objects
			lightGlowColor = 'hsla(201, 100%, 92%, 0.4)'; // Very light blue with some opacity
		}
		
		glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)'); // Transparent at center
		glowGradient.addColorStop(0.3, lightGlowColor); // Light color
		glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Transparent at edge
		
		ctx.fillStyle = glowGradient;
		ctx.beginPath();
		ctx.arc(x, y, nodeStyle.glowRadius, 0, Math.PI * 2);
		ctx.fill();
	}
	
	// Create radial gradient for the node - starting at 50% like the CSS example
	const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
	
	// Use custom colors if provided
	const centerColor = d.centerColor || nodeStyle.centerColor;
	const edgeColor = d.edgeColor || nodeStyle.edgeColor;
	
	// Start with white/transparent until 50%, then gradient to edge color
	gradient.addColorStop(0, centerColor);
	gradient.addColorStop(0.5, centerColor); // Keep center color until 50%
	gradient.addColorStop(1, edgeColor); // Then gradient to edge color
	
	// Draw the node
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
	
	// No border - the glow effect is enough
	// Removed the stroke/border code that was here
	
	// Draw icon if available (for type nodes with iconName)
	// Check both d.type === 'type' and d.layout === 4 (Type layout)
	if ((d.type === 'type' || d.layout === 4)) {
		if (d.iconName) {
			if (images[d.iconName]) {
				const icon = images[d.iconName];
				const iconSize = radius * 0.7; // 30% smaller - icon size relative to node
				const iconX = x - iconSize / 2;
				const iconY = y - iconSize / 2;
				
				// Draw the icon
				ctx.save();
				ctx.globalAlpha = 1.0; // Full opacity since the icon already has the right opacity
				ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
				ctx.restore();
			} else {
				console.log('[Worker] Icon not in images cache for node:', d.id, 'iconName:', d.iconName, 'available:', Object.keys(images));
			}
		} else {
			//console.log('[Worker] Type node has no iconName:', d.id, d.label);
		}
	} else if (d.iconEmoji) {
		// Draw emoji for nodes without iconName
		ctx.save();
		ctx.font = `${radius}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
		ctx.fillText(d.iconEmoji, x, y);
		ctx.restore();
	}
	
	// Draw label if needed
	const labelText = d.shortName || d.label; // Use label if shortName not available
	if (settings.label && labelText && (transform.k >= transformThreshold)) {
		ctx.globalAlpha = 1;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		
		// Set font
		ctx.font = getFont();
		
		const textHeight = 14 / transform.k;
		const yOffset = radius + (10 / transform.k); // Much closer to the circle (10px)
		
		// Split long text into multiple lines
		const maxWidth = 80 / transform.k;
		const words = labelText.split(' ');
		const lines = [];
		let currentLine = words[0];
		
		for (let i = 1; i < words.length; i++) {
			const testLine = currentLine + ' ' + words[i];
			const metrics = ctx.measureText(testLine);
			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine);
				currentLine = words[i];
			} else {
				currentLine = testLine;
			}
		}
		lines.push(currentLine);
		
		// Draw white glow/background for each line
		lines.forEach((line, lineIndex) => {
			const lineY = y + yOffset + (lineIndex * textHeight * 1.2);
			
			// White glow effect
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.lineWidth = 4 / transform.k;
			ctx.strokeText(line, x, lineY);
			
			// Draw text
			ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
			ctx.fillText(line, x, lineY);
		});
	}
	
	// Restore the original alpha
	ctx.globalAlpha = savedAlpha;
};

// Keep original edge drawing function
drawEdge = (d, arrowWidth, arrowHeight, arrowStart, arrowEnd) => {
	if (!d.source || !d.target) return; // Safety check
	
	const x1 = d.source.x;
	const y1 = d.source.y;
	const r1 = getRadius(d.source);
	const x2 = d.target.x;
	const y2 = d.target.y;
	const r2 = getRadius(d.target);
	
	// Check if this edge is connected to the hovered node
	const sourceId = d.source.id || d.source;
	const targetId = d.target.id || d.target;
	const io = (isOver && (isOver == sourceId || isOver == targetId));
	
	// Save context state
	ctx.save();
	
	// Force full opacity for edges - they are ALWAYS visible
	ctx.globalAlpha = 1;
	
	// Edge color - subtle gray
	let colorLink = data.colors.link || 'rgba(160, 160, 160, 0.4)'; // Lighter gray edges
	
	if (io) {
		// Highlight the edge if connected to hovered node - slightly darker
		colorLink = data.colors.highlight || 'rgba(120, 120, 120, 0.6)'; // Slightly darker when highlighted
	}
	
	// Draw the edge line - thin and subtle
	ctx.strokeStyle = colorLink;
	// Thinner line width
	const edgeWidth = lineWidth || getLineWidth();
	ctx.lineWidth = Math.max(edgeWidth, 0.8); // Thinner lines, max 0.8 pixels
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	
	// Restore context state
	ctx.restore();
};

// Override getRadius to use custom radius
getRadius = (d) => {
	return (d.customRadius || nodeStyle.defaultRadius) / transform.k;
};

// Simplified theme initialization
initTheme = (theme) => {
	switch (theme) {
		case 'dark':
			hoverAlpha = 0.2;
			break;
		default:
			hoverAlpha = 0.3;
			break;
	};
};

// Use Inter font
initFonts = () => {
	if (!self.FontFace) {
		return;
	};

	const name = 'Inter';
	const fontFace = new FontFace(name, `url("../font/inter/regular.woff2") format("woff2")`);

	self.fonts.add(fontFace);
	fontFace.load().then(() => fontFamily = name);
};

// Keep all the original utility functions and event handlers
// ... (copy remaining functions from original graph.js)

updateForces = () => {
	const old = getNodeMap();
	
	edges = data.edges ? util.objectCopy(data.edges) : [];
	nodes = data.nodes ? util.objectCopy(data.nodes) : [];
	
	updateOrphans();
	
	let map = getNodeMap();
	edges = edges.filter(d => map.get(d.source) && map.get(d.target));
	
	nodes = nodes.map(d => {
		let o = old.get(d.id) || { x: width / 2, y: height / 2 };
		return Object.assign(o, d);
	});
	edges = edges.map(d => Object.assign({}, d));
	
	simulation.nodes(nodes);
	simulation.force('link')
		.id(d => d.id)
		.links(edges);
	
	const tmpEdgeMap = getEdgeMap();
	
	edgeMap.clear();
	nodes.forEach(d => {
		edgeMap.set(d.id, tmpEdgeMap.get(d.id) || []);
	});
	
	simulation.alpha(1).restart();
	
	nodeMap = getNodeMap();
	redraw();
};

updateOrphans = () => {
	const edgeMap = getEdgeMap();
	
	nodes = nodes.map(d => {
		const edges = edgeMap.get(d.id) || [];
		
		d.isOrphan = !edges.length;
		d.linkCnt = 0;
		d.relationCnt = 0;
		
		for (let i = 0; i < edges.length; i++) {
			const t = edges[i].type;
			
			if (t == EdgeType.Link) {
				d.linkCnt++;
			};
			
			if (t == EdgeType.Relation) {
				d.relationCnt++;
			};
		}
		
		return d;
	});
};

redraw = () => {
	cancelAnimationFrame(frame);
	if (!paused) {
		frame = requestAnimationFrame(draw);
	};
};

drawSelectBox = () => {
	const { x, y, width, height } = selectBox;
	
	ctx.save();
	util.roundedRect(x, y, width, height, 1);
	
	ctx.strokeStyle = data.colors.selected;
	ctx.lineWidth = lineWidth3;
	ctx.stroke();
	ctx.restore();
}

onZoom = (data) => {
	transform = Object.assign(transform, data.transform);
	
	util.clearCache('text');
	recalcConstants();
	redraw();
};

recalcConstants = () => {
	borderRadius = getBorderRadius();
	lineWidth = getLineWidth();
	lineWidth3 = lineWidth * 3;
};

onDragToSelectStart = (data) => {
	const { x, y } = data;
	
	selectBox.x = transform.invertX(x);
	selectBox.y = transform.invertY(y);
};

onDragToSelectMove = (data) => {
	const x = transform.invertX(data.x);
	const y = transform.invertY(data.y);
	
	selectBox.width = x - selectBox.x;
	selectBox.height = y - selectBox.y;
	
	const left = Math.min(selectBox.x, x);
	const top = Math.min(selectBox.y, y);
	const right = Math.max(selectBox.x, x);
	const bottom = Math.max(selectBox.y, y);
	const selected = [];
	
	nodes.forEach(d => {
		if ((d.x >= left) && (d.x <= right) && (d.y >= top) && (d.y <= bottom)) {
			selected.push(d.id);
		};
	});
	
	send('onSelectByDragToSelect', { selected })
	redraw();
};

onDragToSelectEnd = () => {
	selectBox = { x: 0, y: 0, width: 0, height: 0 };
	send('onTransform', { ...transform });
};

onDragStart = ({ active }) => {
	if (!active) {
		restart(0.3);
	};
};

onDragMove = ({ subjectId, x, y }) => {
	send('onDragMove');
	
	if (!subjectId) {
		return;
	};
	
	const d = getNodeById(subjectId);
	if (!d) {
		return;
	};
	
	const radius = getRadius(d);
	
	d.fx = transform.invertX(x) - radius / 2;
	d.fy = transform.invertY(y) - radius / 2;
	
	redraw();
};

onDragEnd = ({ active }) => {
	if (!active) {
		simulation.alphaTarget(0);
	};
};

onClick = ({ x, y }) => {
	const d = getNodeByCoords(x, y);
	send('onClick', { node: d?.id });
};

onSelect = ({ x, y, selectRelated }) => {
	const d = getNodeByCoords(x, y);
	
	let related = [];
	
	if (d) {
		if (selectRelated) {
			related = edgeMap.get(d.id);
		};
		
		send('onSelect', { node: d.id, related });
	};
};

onSetRootId = ({ x, y }) => {
	const d = getNodeByCoords(x, y);
	if (d) {
		this.setRootId({ rootId: d.id });
		send('setRootId', { node: d.id });
	};
};

onSetEdges = (param) => {
	data.edges = param.edges;
	updateForces();
};

onSetSelected = ({ ids }) => {
	selected = ids;
	redraw();
};

onMouseMove = ({ x, y }) => {
	const d = getNodeByCoords(x, y);
	
	isOver = d ? d.id : '';
	
	send('onMouseMove', { node: (d ? d.id : ''), x, y, k: transform.k });
	redraw();
	clearTimeout(timeoutHover);
	
	if (!d) {
		isHovering = false;
		return;
	};
	
	timeoutHover = setTimeout(() => {
		const d = getNodeByCoords(x, y);
		if (d) {
			isHovering = true;
		};
		
		redraw();
	}, 200);
};

onContextMenu = ({ x, y }) => {
	const d = getNodeByCoords(x, y);
	
	isOver = d ? d.id : '';
	
	if (d) {
		send('onContextMenu', { node: d, x, y });
	} else {
		send('onContextSpaceClick', { x, y });
	};
	
	redraw();
};

onAddNode = ({ target, sourceId }) => {
	const id = data.nodes.length;
	
	let x = 0;
	let y = 0;
	
	if (sourceId) {
		const source = getNodeById(sourceId);
		if (!source) {
			return;
		};
		
		x = source.x + (target.customRadius || nodeStyle.defaultRadius) * 2;
		y = source.y + (target.customRadius || nodeStyle.defaultRadius) * 2;
		
		data.edges.push({ type: EdgeType.Link, source: source.id, target: target.id });
	};
	
	target = Object.assign(target, {
		index: id,
		vx: 1, 
		vy: 1,
		forceShow: true,
	});
	
	if (!target.x && !target.y) {
		target = Object.assign(target, { x, y });
	};
	
	data.nodes.push(target);
	
	updateForces();
};

onRemoveNode = ({ ids }) => {
	isHovering = false;
	
	data.nodes = data.nodes.filter(d => !ids.includes(d.id));
	data.edges = data.edges.filter(d => !ids.includes(d.source.id) && !ids.includes(d.target.id));
	
	updateForces();
};

setRootId = (param) => {
	rootId = param.rootId;
	root = getNodeById(rootId);
	
	if (!root) {
		return;
	};
	
	const coords = { x: transform.x, y: transform.y };
	const to = getCenter(root.x, root.y);
	
	new TWEEN.Tween(coords)
	.to(to, 500)
	.easing(TWEEN.Easing.Quadratic.InOut)
	.onUpdate(() => {
		transform = Object.assign(transform, coords);
		redraw();
	})
	.onComplete(() => send('onTransform', { ...transform }))
	.start();
	
	redraw();
};

restart = (alpha) => {
	simulation.alphaTarget(alpha).restart();
};

resize = (data) => {
	width = data.width;
	height = data.height;
	density = data.density;
	
	ctx.canvas.width = width * density;
	ctx.canvas.height = height * density;
	ctx.scale(density, density);
	
	redraw();
};

updateSettings = (param) => {
	settings = Object.assign(settings, param);
	redraw();
};

updateTheme = ({ theme, colors }) => {
	data.colors = colors;
	initTheme(theme);
	redraw();
};

image = ({ src, bitmap }) => {
	console.log('[Worker] Received image (handler 2):', src, 'bitmap:', bitmap);
	if (!images[src]) {
		images[src] = bitmap;
		console.log('[Worker] Stored image:', src, 'total images:', Object.keys(images).length);
	} else {
		console.log('[Worker] Image already exists:', src);
	}
};

// Utility functions
const send = (id, data) => {
	this.postMessage({ id, data });
};

const checkNodeInViewport = (d) => {
	const dr = (d.customRadius || nodeStyle.defaultRadius) * transform.k;
	const distX = transform.x + d.x * transform.k - dr;
	const distY = transform.y + d.y * transform.k - dr;
	
	return (distX >= -dr * 2) && (distX <= width) && (distY >= -dr * 2) && (distY <= height);
};

const getNodeById = (id) => {
	return nodeMap.get(id) || nodes.find(d => d.id == id);
};

const getNodeByCoords = (x, y) => {
	// Increase search radius to match the actual node size (25-30 pixels)
	const searchRadius = 30 / transform.k;
	return simulation.find(transform.invertX(x), transform.invertY(y), searchRadius);
};

const getEdgeMap = () => {
	const map = new Map();
	
	for (let i = 0; i < edges.length; i++) {
		const e = edges[i];
		
		if (!map.has(e.source)) {
			map.set(e.source, []);
		};
		if (!map.has(e.target)) {
			map.set(e.target, []);
		};
		
		map.get(e.source).push(e);
		map.get(e.target).push(e);
	};
	
	return map;
};

const getFont = () => {
	return `${12 / transform.k}px ${fontFamily}`;
};

const getNodeMap = () => {
	return new Map(nodes.map(d => [ d.id, d ]));
};

const getCenter = (x, y) => {
	return { x: width / 2 - x * transform.k, y: height / 2 - y * transform.k };
};

const getLineWidth = () => {
	// Thinner lines for more subtle appearance
	const width = 1 / transform.k; // Reduced to 1 for thinner lines
	return Math.max(width, 0.5); // Minimum width of 0.5 pixel
};

const getBorderRadius = () => {
	return 3.33 / transform.k;
};

// Mouse event handlers for drag and drop
onMouseDown = ({ x, y }) => {
	const node = getNodeByCoords(x, y);
	
	if (node && node.x !== undefined && node.y !== undefined) {
		// Ensure we have the actual node from the nodes array
		const actualNode = nodes.find(n => n.id === node.id);
		if (actualNode) {
			isDragging = true;
			dragNode = actualNode;
			dragOffset.x = x - (transform.x + actualNode.x * transform.k);
			dragOffset.y = y - (transform.y + actualNode.y * transform.k);
			
			// Fix the node's position while dragging
			actualNode.fx = actualNode.x;
			actualNode.fy = actualNode.y;
			
			// Activate simulation for dragging but control the alpha carefully
			if (simulation) {
				// Only restart if simulation is completely stopped
				if (simulation.alpha() < 0.001) {
					// Start with low alpha to prevent force explosion
					simulation.alpha(0.05).alphaTarget(0.05).restart();
				} else {
					// Just set target, don't restart
					simulation.alphaTarget(0.05);
				}
			}
		}
	}
};

onMouseMove = ({ x, y }) => {
	
	if (isDragging && dragNode) {
		// Calculate new position in simulation coordinates
		const newX = (x - dragOffset.x - transform.x) / transform.k;
		const newY = (y - dragOffset.y - transform.y) / transform.k;
		
		// Validate coordinates before applying
		if (!isNaN(newX) && !isNaN(newY) && isFinite(newX) && isFinite(newY)) {
			// Update fixed position
			dragNode.fx = newX;
			dragNode.fy = newY;
			
			// Immediate position update for smooth dragging
			dragNode.x = newX;
			dragNode.y = newY;
			
			// Ensure the node stays in the nodes array
			const nodeIndex = nodes.findIndex(n => n.id === dragNode.id);
			if (nodeIndex !== -1) {
				nodes[nodeIndex].x = newX;
				nodes[nodeIndex].y = newY;
				nodes[nodeIndex].fx = newX;
				nodes[nodeIndex].fy = newY;
			}
			
			// Update edges that reference this node
			edges.forEach(edge => {
				if (edge.source.id === dragNode.id) {
					edge.source.x = newX;
					edge.source.y = newY;
				}
				if (edge.target.id === dragNode.id) {
					edge.target.x = newX;
					edge.target.y = newY;
				}
			});
		}
		
		// Keep simulation running with enough activity for links to work
		if (simulation && simulation.alpha() < 0.05) {
			// Just set alpha target, don't restart which would set alpha to 1
			simulation.alphaTarget(0.05);
		}
		
		redraw();
	} else {
		// Check for hover
		const node = getNodeByCoords(x, y);
		isOver = node ? node.id : '';
		redraw();
	}
};

onMouseUp = ({ x, y }) => {
	if (isDragging && dragNode) {
		// Release the fixed position
		dragNode.fx = null;
		dragNode.fy = null;
		
		// Stop simulation gradually
		if (simulation) {
			simulation.alphaTarget(0);
		}
		
		isDragging = false;
		dragNode = null;
		
		redraw();
	}
};

onMouseLeave = () => {
	// Called when mouse leaves the canvas (e.g., enters popup area)
	if (isDragging && dragNode) {
		console.log('Mouse left canvas, releasing node:', dragNode.id);
		
		// Release the fixed position
		dragNode.fx = null;
		dragNode.fy = null;
		
		// Give simulation energy to push node out of any blocking area
		if (simulation) {
			simulation.alphaTarget(0.3).restart();
		}
		
		isDragging = false;
		dragNode = null;
		
		redraw();
	}
};
