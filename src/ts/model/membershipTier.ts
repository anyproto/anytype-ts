import { I, U } from 'Lib';

const COLORS = [
	'green',
	'blue',
	'red',
	'ice',
];

class MembershipTier implements I.MembershipTier {

	id: I.TierType = I.TierType.None;
	name = '';
	description = '';
	colorStr = '';
	nameMinLength = 0;
	isTest = false;
	periodType = 0;
	period = 0;
	priceCents = 0;
	features = [];
	namesCount = 0;

	constructor (props: Partial<I.MembershipTier>) {
		this.id = Number(props.id) || I.TierType.None;
		this.name = String(props.name || '');
		this.description = String(props.description || '');
		this.colorStr = String(props.colorStr || '');
		this.nameMinLength = Number(props.nameMinLength) || 0;
		this.isTest = Boolean(props.isTest);
		this.periodType = Number(props.periodType) || 0;
		this.period = Number(props.period) || 0;
		this.priceCents = Number(props.priceCents) || 0;
		this.features = Array.isArray(props.features) ? props.features : [];
		this.namesCount = Number(props.namesCount) || 0;
	};

	get color (): string {
		return COLORS.includes(this.colorStr) ? this.colorStr : 'default';
	};

	get price (): number {
		return U.Common.round(this.priceCents / 100, 2);
	};

	get isNone (): boolean {
		return this.id == I.TierType.None;
	};

	get isExplorer (): boolean {
		return this.id == I.TierType.Explorer;
	};

	get isBuilder (): boolean {
		return [ I.TierType.BuilderTest, I.TierType.Builder ].includes(this.id);
	};

	get isCreator (): boolean {
		return [ I.TierType.CoCreatorTest, I.TierType.CoCreator ].includes(this.id);
	};

};

export default MembershipTier;
