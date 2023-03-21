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

export enum OnboardStage {
	Void = 0,
	KeyPhrase = 1,
	Offline = 2,
	Soul = 3,
	SoulCreating = 4,
	SpaceCreating = 5,
};