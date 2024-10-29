/* 
NOTE: this file is copy pasted from the JS-Onboard-Animation Repository
*/

export const DOM_EVENTS: { [key: string]: [string, boolean] } = {
  onClick: ['click', false],
  onContextMenu: ['contextmenu', false],
  onDoubleClick: ['dblclick', false],
  onWheel: ['wheel', true],
  onPointerDown: ['pointerdown', true],
  onPointerUp: ['pointerup', true],
  onPointerLeave: ['pointerleave', true],
  onPointerMove: ['pointermove', true],
  onPointerCancel: ['pointercancel', true],
  onLostPointerCapture: ['lostpointercapture', true],
};

// TODO these need to be verified to be the correct
export enum OnboardStage {
  Void = 0, // initial
  Phrase = 1, // grid
  Offline = 2, // zoomOut
  Soul = 3, // connected
  SoulCreating = 4, // initial2
  SpaceCreating = 5, // zoomIn
}

export const StatePropertyMap = {
  Void: {
	zoom: 6.7,
  },
  Offline: {
	zoom: 1,
  },
  SoulCreating: {
	zoom: 6.7,
  },
  SpaceCreating: {
	zoom: 35,
  },
} as const;

export const colors = {
  pink: '#FF93AD',
  blue: '#4777FE',
};

export const circlesParams = {
  NUM_CIRCLES: 5,
  RADIUS: 2.2,
  SPACING: 1.4,
  CIRCLES_PER_ROW: 10,
  CIRCLES_PER_COL: 10,
};

export const linesAnimationDuration = 1;

export const staggerDuration = 0.15; // Set the stagger duration (in seconds)

export const bgColor = '#060606';

export const timeToShow = 1;

export const statsVisible = true;
