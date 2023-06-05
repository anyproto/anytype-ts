import * as React from 'react';
import { Frame, Title, Label, Button, Loader } from 'Component';
import { C, I, ObjectUtil, Util, translate } from 'Lib';
import { observer } from 'mobx-react';
import $ from 'jquery';
import Constant from 'json/constant.json';

const PageMainUsecase = observer(class PageMainUsecase extends React.Component<I.PageComponent, object> {
    loading: boolean = false;

    constructor (props: I.PageComponent) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
        const cases: any[] = [
            { id: 1, img: 'img/usecase/personal-projects.png' },
            { id: 3, img: 'img/usecase/notes-or-diary.png' },
            { id: 2, img: 'img/usecase/knowledge-base.png' },
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

                <Frame>
                    <Title className="frameTitle" text={translate('authUsecaseTitle')} />
                    <Label className="frameLabel" text={translate('authUsecaseLabel')} />

                    <div className="usecaseList">
                        {cases.map((el, i: number) => (
                            <Case key={i} {...el} />
                        ))}
                    </div>

                    <div className="buttons">
                        <Button className="c28 outlined" text={translate('authUsecaseSkip')} onClick={(e) => this.onClick(e, 0)} />
                    </div>
                    {this.loading ? <Loader /> : ''}
                </Frame>
            </div>
        );
    };

    onClick (e: any, id: number) {
        e.preventDefault();

        if (this.loading) {
            return;
        };

        this.loading = true;
        this.forceUpdate();

        C.ObjectImportUseCase(id, () => {
            $('.usecaseWrapper').css({'opacity': 0});

            window.setTimeout(() => {
                this.loading = false;
                ObjectUtil.openRoute({ layout: I.ObjectLayout.Graph });
            }, 600);
        });
    };

});

export default PageMainUsecase;