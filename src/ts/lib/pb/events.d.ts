import type * as Events from 'dist/lib/pb/protos/events_pb.js';

declare module 'dist/lib/pb/protos/events_pb' {
	namespace Model {
		export interface Process {
			getType(): number;
		}
	}   
}
