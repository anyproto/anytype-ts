import * as React from 'react';
import { Frame, Title, Label, Button, Header, Footer, DotIndicator } from 'Component';
import { I, translate, Animation, } from 'Lib';
import { observer } from 'mobx-react';

enum OnboardStage {
	VOID = 0,
	KEY_PHRASE = 1,
	OFFLINE = 2,
	SOUL = 3,
	SOUL_CREATING = 4,
	SPACE_CREATING = 5,

}

type State = {
	stage: OnboardStage;
	keyPhraseCopied: boolean;
}

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {
	state: State = {
		stage: OnboardStage.VOID,
		keyPhraseCopied: false,
	}

	constructor (props: I.PageComponent) {
        super(props);
		this.onNext = this.onNext.bind(this);
	};
	
	render () {
		const { stage } = this.state;

		// Mapping the Stages to text.json keys
		const stageNameMap = {
			[OnboardStage.VOID]: "Void",
			[OnboardStage.KEY_PHRASE]: "KeyPhrase",
			[OnboardStage.OFFLINE]: "Offline",
			[OnboardStage.SOUL]: "Soul",
			[OnboardStage.SOUL_CREATING]: "SoulCreating",
			[OnboardStage.SPACE_CREATING]: "SpaceCreating",
		}

		const title = <Title className="animation" text={translate(`authOnboard${stageNameMap[stage]}Title`)} />;
		let label = <Label className="animation" text={translate(`authOnboard${stageNameMap[stage]}Label`)} />;
		let submit = <Button text={translate(`authOnboard${stageNameMap[stage]}Submit`)} onClick={this.onNext} />;
		let dotIndicator = <DotIndicator activeIndex={this.state.stage} count={4} />;

		if (stage === OnboardStage.VOID || (stage === OnboardStage.KEY_PHRASE && this.state.keyPhraseCopied)) {
			submit = <Button text={translate(`authOnboardSubmit`)} onClick={this.onNext} />;
		}
		if (stage === OnboardStage.SOUL_CREATING || stage === OnboardStage.SPACE_CREATING) {
			label = null;
			submit = null;
			dotIndicator = null;
		}

        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				<Frame>
					{dotIndicator}
					{title}
					{label}	
					<div className="buttons">
						<div className="animation">
							{submit}
						</div>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();
	};

	componentDidUpdate(): void {
		Animation.to();
	}

	onNext () {
		Animation.from(() => { this.setState(prev => ({ ...prev, stage: prev.stage + 1 })) });
	}
});

export default PageAuthOnboard;