import { I, UtilCommon } from 'Lib';

const COLORS = [
	'green',
	'blue',
	'red',
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

	constructor (props: I.MembershipTier) {
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
	};

	get color (): string {
		return COLORS.includes(this.colorStr) ? this.colorStr : 'default';
	};

	get price (): number {
		return UtilCommon.round(this.priceCents / 100, 2);
	};

};

export default MembershipTier;