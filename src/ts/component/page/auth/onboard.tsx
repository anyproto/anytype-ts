import * as React from 'react';
import { Frame, Title, Label, Button, Header, Footer, DotIndicator } from 'Component';
import { I, translate, Animation, Util } from 'Lib';
import { observer } from 'mobx-react';

type State = {
	index: number;
}

const PageAuthOnboard = observer(class PageAuthOnboard extends React.Component<I.PageComponent, State> {
	state: State = {
		index: 0,
	}

	constructor (props: I.PageComponent) {
        super(props);
		this.onNext = this.onNext.bind(this);
	};
	
	render () {
        return (
			<div>
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				<Frame>
					<DotIndicator activeIndex={0} count={4} />
					<Title className="animation" text={translate('authOnboardVoidTitle')} />
					<Label className="animation" text={translate('authOnboardVoidLabel')} />
								
					<div className="buttons">
						<div className="animation">
							<Button text={translate('authOnboardNext')} onClick={this.onNext} />
						</div>
					</div>
				</Frame>
			</div>
		);
	};

	componentDidMount(): void {
		Animation.to();
	};

	onNext () {
		Animation.from(() => { Util.route('/auth/onboard/encrypt') });
	}
});

export default PageAuthOnboard;