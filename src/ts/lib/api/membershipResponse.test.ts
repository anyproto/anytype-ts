import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as I from 'Interface';

vi.mock('./service', () => ({ ServiceClient: class {} }));
vi.mock('./grpc-devtools', () => ({ unaryInterceptors: [], streamInterceptors: [] }));
vi.mock('../presence', () => ({ presence: { onMessage: vi.fn() } }));
vi.mock('Lib/membership', () => ({ membership: { onStatusEvent: vi.fn(), onProductsEvent: vi.fn() } }));
vi.mock('Model', () => ({}));

import { dispatcher } from './dispatcher';
import { Mapper } from './mapper';
import * as Response from './response';

const revision = { epoch: 77, counter: 5 };
const fetchState = { freshness: 1, lastSuccessfulFetchAt: 1700000000, lastRefreshError: 1, revision };
const purchased = { product: { id: '20', name: 'Legacy', isHidden: true, isTopLevel: true }, purchaseInfo: { dateEnds: 10 }, productStatus: { status: 2 } };

beforeEach(() => {
	vi.stubGlobal('S', { Common: { config: { flagsMw: {} } }, Auth: { token: '' } });
	vi.stubGlobal('U', { Common: { translateError: (_type: string, error: any) => error.description } });
	vi.stubGlobal('analytics', { event: vi.fn() });
	vi.stubGlobal('Mapper', Mapper);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	dispatcher.service = null;
});

describe('membership fetch state mapping', () => {

	it('maps freshness, last success, error class and revision', () => {
		expect(Mapper.From.MembershipFetchState(fetchState)).toEqual({
			freshness: I.MembershipFreshness.Stale,
			lastSuccessfulFetchAt: 1700000000,
			lastRefreshError: I.MembershipRefreshError.PaymentNode,
			revision: { epoch: '77', counter: 5 },
		});
	});

	it('keeps the zero value as FRESH and a missing revision as null', () => {
		expect(Mapper.From.MembershipFetchState({})).toEqual({
			freshness: I.MembershipFreshness.Fresh,
			lastSuccessfulFetchAt: 0,
			lastRefreshError: I.MembershipRefreshError.Null,
			revision: null,
		});
		expect(Mapper.From.MembershipFetchState({ freshness: 2, revision: { epoch: 0, counter: 0 } }).revision).toBeNull();
	});

	it('maps missing metadata to null and unknown enum values to NONE / Unknown', () => {
		expect(Mapper.From.MembershipFetchState(undefined)).toBeNull();
		expect(Mapper.From.MembershipFetchState({ freshness: -1, lastRefreshError: 9 })).toEqual(expect.objectContaining({
			freshness: I.MembershipFreshness.None,
			lastRefreshError: I.MembershipRefreshError.Unknown,
		}));
	});

	it('keeps a 64-bit epoch as an exact string', () => {
		expect(Mapper.From.MembershipFetchState({ revision: { epoch: '18446744073709551615', counter: 1 } }).revision.epoch).toBe('18446744073709551615');
	});
});

describe('membership payload mapping', () => {

	it('keeps a missing status as null, not as "no purchases"', () => {
		expect(Mapper.From.MembershipData(undefined)).toBeNull();
		expect(Response.MembershipV2GetStatus({ fetchState: { freshness: 2 } })).toEqual({
			data: null,
			fetchState: expect.objectContaining({ freshness: I.MembershipFreshness.None }),
		});
		expect(Mapper.Event.MembershipV2Update({}).data).toBeNull();
	});

	it('keeps the embedded purchased product', () => {
		const data = Mapper.From.MembershipData({ products: [ purchased ] });

		expect(data.products[0].product).toEqual(expect.objectContaining({ id: '20', name: 'Legacy', isHidden: true }));
		expect(data.products[0].status).toBe(2);
		expect(Mapper.From.MembershipData({ products: [ { purchaseInfo: {} } ] }).products[0].product).toBeNull();
	});

	it('carries fetch state through response and event mappers', () => {
		expect(Response.MembershipV2GetProducts({ products: [ { id: '1' } ], fetchState }).fetchState.revision).toEqual({ epoch: '77', counter: 5 });
		expect(Response.MembershipV2GetProducts({}).products).toBeNull();
		expect(Mapper.Event.MembershipV2Update({ data: { products: [ purchased ] }, fetchState }).fetchState.freshness).toBe(I.MembershipFreshness.Stale);
		expect(Mapper.Event.MembershipV2ProductsUpdate({ products: [], fetchState }).fetchState.revision.counter).toBe(5);
	});
});

describe('membership responses on RPC errors', () => {

	it.each([ 'MembershipV2GetStatus', 'MembershipV2GetProducts' ])('%s keeps NONE and the revision with the error', command => {
		const none = { freshness: 2, revision: { epoch: 3, counter: 1 } };
		dispatcher.service = { request: (_type, _data, _metadata, callback) => callback(null, { fetchState: none, products: [], data: { products: [] }, error: { code: 4, description: 'payment node' } }) } as any;

		const done = vi.fn();
		dispatcher.request(command, {}, done);

		const message = done.mock.calls[0][0];
		expect(message.error.code).toBe(4);
		expect(message.fetchState).toEqual(expect.objectContaining({ freshness: I.MembershipFreshness.None, revision: { epoch: '3', counter: 1 } }));
	});

	it('keeps STALE data on an error response', () => {
		dispatcher.service = { request: (_type, _data, _metadata, callback) => callback(null, { fetchState, data: { products: [ purchased ] }, error: { code: 1, description: 'x' } }) } as any;

		const done = vi.fn();
		dispatcher.request('MembershipV2GetStatus', {}, done);

		expect(done.mock.calls[0][0].data.products.length).toBe(1);
	});

	it('reports a transport error without fetch state', () => {
		dispatcher.service = { request: (_type, _data, _metadata, callback) => callback({ code: 14, message: 'unavailable' }, null) } as any;

		const done = vi.fn();
		dispatcher.request('MembershipV2GetStatus', {}, done);

		expect(done).toHaveBeenCalledWith({ error: { code: 14, description: 'unavailable' } });
	});
});
