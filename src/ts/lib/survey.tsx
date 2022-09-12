import { C, I, Storage, Util, analytics, Renderer, translate } from 'Lib';
import { popupStore, authStore, dbStore } from 'Store';

const Surveys = require('json/survey.json');

class Survey {

    check (type: I.SurveyType) {
        switch (type) {
            case I.SurveyType.Register:
                this.checkRegister();
                break;

            case I.SurveyType.Pmf:
                this.checkPmf();
                break;

            case I.SurveyType.Object:
                this.checkObject();
                break;

            case I.SurveyType.Delete:
                this.checkDelete();
                break;
        }
    };

    show (type: I.SurveyType) {
        const prefix = Util.toCamelCase('survey-' + type);

        analytics.event(prefix + 'Show');

        popupStore.open('confirm', {
            onClose: () => {
                this.onSkip(type);
            },
            data: {
                title: translate(prefix + 'Title'),
                text: translate(prefix + 'Text'),
                textConfirm: translate(prefix + 'Confirm'),
                textCancel: translate(prefix + 'Cancel'),
                canConfirm: true,
                canCancel: true,
                onConfirm: () => {
                    this.onConfirm(type);
                },
                onCancel: () => {
                    this.onSkip(type);
                }
            }
        });
    };

    onConfirm (type: I.SurveyType) {
        const { account } = authStore;
        const survey = Surveys[type];
        const prefix = Util.toCamelCase('survey-' + type);
		const param: any = {};

        switch (type) {
			default:
				param[`${type}Complete`] = true;
				break;

            case I.SurveyType.Pmf:
                param.pmfCompleteTime = Util.time();
                break;
        };

		Storage.set('survey', param);
		Renderer.send('urlOpen', Util.sprintf(survey.url, account.id));
        analytics.event(prefix + 'Open');
    };

    onSkip (type: I.SurveyType) {
        const prefix = Util.toCamelCase('survey-' + type);
		const param: any = {};

        switch (type) {
			default:
				param[`${type}Complete`] = true;
				break;

            case I.SurveyType.Pmf:
                param.pmfCanceled = true;
                param.pmfCompleteTime = Util.time();
                break;
        };

		Storage.set('survey', param);
		analytics.event(prefix + 'Skip');
    };

    checkPmf () {
        const surveyStorage = Storage.get('survey') || {};
        const lastTime = Number(Storage.get('lastSurveyTime')) || Number(surveyStorage.pmfCompleteTime) || 0;
        const lastCanceled = Number(Storage.get('lastSurveyCanceled')) || Number(surveyStorage.pmfCanceled) || false;
        const askPmf = Number(surveyStorage.askPmf) || false;
        const days = lastTime ? 90 : 30;
        const surveyTime = (lastTime <= Util.time() - 86400 * days);

        if (askPmf && !popupStore.isOpen() && !lastCanceled && surveyTime) {
            this.show(I.SurveyType.Pmf);
        };
    };

    checkRegister () {
        const timeRegister = Number(Storage.get('timeRegister')) || 0;
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = surveyStorage.registerComplete || false;
        const surveyTime = timeRegister && Util.time() - 86400 * 7 - timeRegister > 0;

        if (!isComplete && surveyTime && !popupStore.isOpen()) {
            this.show(I.SurveyType.Register);
        };
    };

    checkDelete () {
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = Number(surveyStorage.deleteComplete) || false;

        if (!isComplete) {
            this.show(I.SurveyType.Delete);
        };
    };

    checkObject () {
        const timeRegister = Number(Storage.get('timeRegister')) || 0;
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = Number(surveyStorage.objectComplete) || false;

        if (isComplete || !timeRegister) {
            return;
        };

        const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
        const filters: I.Filter[] = [
            { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
            { operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: timeRegister + 30 },
        ];

        C.ObjectSearch(filters, [], [], '', 0, 50, (message: any) => {
            if (message.error.code) {
                return;
            };

            if (message.records.length >= 50) {
                this.show(I.SurveyType.Object);
            };
        });
    };

}

export default new Survey();