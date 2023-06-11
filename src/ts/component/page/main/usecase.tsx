import * as React from 'react';
import { Frame, Title, Label, Button, Loader } from 'Component';
import { C, I, UtilObject, UtilCommon, translate } from 'Lib';
import { observer } from 'mobx-react';
import $ from 'jquery';

interface State {
	isLoading: boolean;
};

const PageMainUsecase = observer(class PageMainUsecase extends React.Component<I.PageComponent, State> {

	state = {
		isLoading: false
	};

    constructor (props: I.PageComponent) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
		const { isLoading } = this.state;
        const cases: any[] = [
            { id: 1, img: 'img/usecase/personal-projects.png' },
            { id: 2, img: 'img/usecase/knowledge-base.png' },
            { id: 3, img: 'img/usecase/notes-or-diary.png' }
        ];

        const Case = (el) => (
            <div className="case" onClick={(e) => this.onClick(e, el.id)}>
                <Title className="caseTitle" text={translate(`authUsecaseCase${el.id}Title`)} />
                <Label className="caseLabel" text={translate(`authUsecaseCase${el.id}Label`)} />
                <img src={el.img} />
            </div>
        );

        return (
            <div className="usecaseWrapper">
                <div className='fadeInOverlay' />

                <Frame>
					{isLoading ? <Loader /> : ''}

                    <Title className="frameTitle" text={translate('authUsecaseTitle')} />
                    <Label className="frameLabel" text={translate('authUsecaseLabel')} />

                    <div className="usecaseList">
                        {cases.map((el, i: number) => (
                            <Case key={i} {...el} />
                        ))}
                    </div>

                    <div className="buttons">
                        <Button color="blank" className="c36" text={translate('authUsecaseSkip')} onClick={(e) => this.onClick(e, 0)} />
                    </div>
                </Frame>
            </div>
        );
    };

    onClick (e: any, id: number) {
        e.preventDefault();

		const { isLoading } = this.state;

        if (isLoading) {
            return;
        };

		this.setState({ isLoading: true });

        C.ObjectImportUseCase(id, () => {
            $('.usecaseWrapper').css({ 'opacity': 0 });

            window.setTimeout(() => {
                this.setState({ isLoading: false });
                UtilObject.openRoute({ layout: I.ObjectLayout.Graph });
            }, 600);
        });
    };

});

export default PageMainUsecase;