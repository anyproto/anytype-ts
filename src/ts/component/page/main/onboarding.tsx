import * as React from 'react';
import { Animation, I, translate, U } from 'Lib';
import { Icon, Title, Label } from 'Component';

enum Stage {
	Type	 = 0,
	Purpose	 = 1,
	Usecase	 = 2,
};

type State = {
	stage: Stage;
};

class PageMainOnboarding extends React.Component<I.PageComponent, State> {

	state: State = {
		stage: Stage.Type,
	};
	param: any = {
		type: I.SpaceType.Private,
		purpose: 'personal',
		usecase: 0,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.getItems = this.getItems.bind(this);
		this.onItemClick = this.onItemClick.bind(this);
		this.onBack = this.onBack.bind(this);
	};

	render () {
		const { stage } = this.state;
		const { type } = this.param;
		const cn = [ 'wrapper', `stage${Stage[stage]}` ];
		const items = this.getItems(stage);

		const Item = (el) => {
			const prefix = U.Common.toCamelCase(`onboardingExperienceItems-${el.id}`);

			let labelPrefix = '';
			if (el.id == 'personal') {
				labelPrefix = U.Common.toCamelCase(`onboardingExperienceItems-${el.id}-${I.SpaceType[type]}`)
			};

			return (
				<div onClick={() => this.onItemClick(el)} className={[ 'item', `item-${el.id}` ].join(' ')}>
					<Icon className={el.id} />
					<Title text={translate(`${prefix}Title`)} />
					<Label text={translate(`${labelPrefix ? labelPrefix : prefix}Text`)} />
				</div>
			);
		};

		const UsecaseItem = (el) => {
			return <div />;
		};

		return (
			<div className={cn.join(' ')}>
				{this.canMoveBack() ? <Icon className="arrow back" onClick={this.onBack} /> : ''}

				<Title text={translate(`onboardingExperience${Stage[stage]}Title`)} />

				<div className="items">
					{items.map((el, i) => {
						if (stage == Stage.Usecase) {
							return <UsecaseItem key={i} {...el} />;
						};
						return <Item key={i} {...el} />;
					})}
				</div>
			</div>
		);
	};

	getItems (stage: Stage) {
		const { type } = this.param;
		let ret = [];

		switch (stage) {
			default:
			case Stage.Type: {
				ret = [
					{ id: 'private', value: I.SpaceType.Private },
					{ id: 'shared', value: I.SpaceType.Shared },
				];

				break;
			};
			case Stage.Purpose: {
				ret = [
					{ id: 'personal', value: 'personal' },
					{ id: 'education', value: 'education' },
					{ id: 'work', value: 'work' },
				];

				if (type == I.SpaceType.Shared) {
					ret.push({ id: 'community', value: 'community' });
				};

				break;
			};
			case Stage.Usecase: {
				// getting usecases logic
				break;
			};
		};

		return ret.map(it => ({ ...it, stage }));
	};

	onItemClick (item: any) {
		const { stage } = this.state;
		const paramKey = Stage[stage].toLowerCase();

		this.param[paramKey] = item.value;
		this.setState({ stage: stage + 1 });
	};

	onBack () {
		if (!this.canMoveBack()) {
			return;
		};

		const { stage } = this.state;

		this.setState({ stage: stage - 1 });
	};

	canMoveBack (): boolean {
		return this.state.stage > Stage.Type;
	};

	onFinish (routeParam) {
		U.Data.onAuth({ routeParam });
		U.Data.onAuthOnce(true);
	};
};

export default PageMainOnboarding;
