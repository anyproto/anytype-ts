import { describe, it, expect } from 'vitest';
import * as I from 'Interface';
import { Detail } from './detail';

/**
 * A participant object that never went through the space ACL (e.g. opened from a link to
 * someone who was never a member) has no participantStatus and no identity. It used to be
 * mapped to Joining and shown as a nameless join request whose buttons did nothing.
 */

(globalThis as any).Relation = {
	getStringValue: (v: any) => (v === undefined || v === null) ? '' : String(v),
};
(globalThis as any).translate = (key: string) => key;
(globalThis as any).U = {
	Object: {
		isInFileLayouts: () => false,
	},
};

const participant = (details: any) => Detail.mapper({ id: 'p', layout: I.ObjectLayout.Participant, ...details });

describe('Detail.mapParticipant', () => {

	it('should not treat a participant without status as a join request', () => {
		const object = participant({});

		expect(object.isJoining).toBe(false);
		expect(object.isActive).toBe(false);
	});

	it('should treat status 0 as a join request', () => {
		const object = participant({ participantStatus: I.ParticipantStatus.Joining, identity: 'A' });

		expect(object.isJoining).toBe(true);
		expect(object.status).toBe(I.ParticipantStatus.Joining);
	});

	it('should treat status 1 as an active member', () => {
		const object = participant({ participantStatus: I.ParticipantStatus.Active, identity: 'A' });

		expect(object.isActive).toBe(true);
		expect(object.isJoining).toBe(false);
	});

});
