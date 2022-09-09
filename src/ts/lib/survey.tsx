import { C, I, Storage, Util, analytics, Renderer } from 'Lib';
import { popupStore, authStore, dbStore } from 'Store';

const Url = require('json/url.json');

const Surveys = {
    new: {
        text: {
            title: 'Time to take a survey!',
            text: 'Hi there, We hope you\'re enjoying your experience in Anytype! We\'d love to hear your feedback so we can keep improving the product.',
            textConfirm: 'Let\'s Go!',
            textCancel: 'Skip',
        },
        url: Url.survey.new,
        analyticsEvent: 'NewUserSurveyOpen'
    },

    pmf: {
        text: {
            title: 'We need your opinion',
            text: 'Hi there! We\'d love if you\'d help us improve Anytype by taking part in this 5-minute survey.',
            textConfirm: 'Let\'s Go!',
            textCancel: 'Skip',
        },
        url: Url.survey.pmf,
        analyticsEvent: 'PMFSurveyOpen'
    },

    deletion: {
        text: {
            title: 'Help us to become better',
            text: 'We\'d love to learn more about why you\'ve chosen to delete your account. Would you be willing to take 3 minutes to help us improve?',
            textConfirm: 'Sure, let\'s go',
            textCancel: 'No thanks',
        },
        url: Url.survey.deletion,
        analyticsEvent: 'DeletionSurveyOpen'
    },

    fiftyObjects: {
        text: {
            title: 'Tell us how it\'s going!',
            text: 'Hi there, we hope you\'re enjoying your experience with Anytype! Would you take 5 minutes to help us improve our product?',
            textConfirm: 'Sure, let\'s go',
            textCancel: 'No thanks',
        },
        url: Url.survey.fiftyObjects,
        analyticsEvent: 'FiftyObjectsSurveyOpen'
    }
};

class Survey {

    show (type: string) {
        const survey = Surveys[type];
        const text = survey.text;

        analytics.event('SurveyShow');

        popupStore.open('confirm', {
            onClose: () => {
                this.onSkip(type);
            },
            data: {
                title: text.title,
                text: text.text,
                textConfirm: text.textConfirm,
                textCancel: text.textCancel,
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

    onConfirm (type) {
        const { account } = authStore;
        const survey = Surveys[type];

        Renderer.send('urlOpen', Util.sprintf(survey.url, account.id));
        analytics.event(survey.analyticsEvent);

        switch (type) {
            case 'pmf':
                Storage.set('lastPMFSurveyTime', Util.time());
                break;

            case 'new':
                Storage.set('newUserSurveyComplete', 1);
                break;

            case 'deletion':
                Storage.set('deletionSurveyComplete', 1);
                break;

            case 'fiftyObjects':
                Storage.set('fiftyObjectsSurveyComplete', 1);
                break;

        };
    };

    onSkip (type) {
        switch (type) {
            case 'pmf':
                Storage.set('lastPMFSurveyCanceled', 1);
                Storage.set('lastPMFSurveyTime', Util.time());
                break;

            case 'new':
                Storage.set('newUserSurveyComplete', 1);
                break;

            case 'deletion':
                Storage.set('deletionSurveyComplete', 1);
                break;

            case 'fiftyObjects':
                Storage.set('fiftyObjectsSurveyComplete', 1);
                break;

        };
    };

    PMF () {
        const lastTime = Number(Storage.get('lastSurveyTime')) || Number(Storage.get('lastPMFSurveyTime')) || 0;
        const lastCanceled = Number(Storage.get('lastSurveyCanceled')) || Number(Storage.get('lastPMFSurveyCanceled')) || 0;
        const askSurvey = Number(Storage.get('askSurvey')) || 0;
        const days = lastTime ? 90 : 30;
        const surveyTime = (lastTime <= Util.time() - 86400 * days);

        if (askSurvey && !popupStore.isOpen() && !lastCanceled && surveyTime) {
            this.show('pmf');
        };
    };

    newUser () {
        const isComplete = Number(Storage.get('newUserSurveyComplete')) || 0;
        const registrationTime = Number(Storage.get('registrationTime')) || 0;
        const surveyTime = registrationTime && Util.time() - 86400 * 7 - registrationTime > 0;

        if (!isComplete && surveyTime && !popupStore.isOpen()) {
            this.show('new');
        };
    };

    deletion () {
        const isComplete = Number(Storage.get('deletionSurveyComplete')) || 0;

        if (!isComplete) {
            this.show('deletion');
        };
    };

    fiftyObjects () {
        const isComplete = Number(Storage.get('fiftyObjectsSurveyComplete')) || 0;
        const registrationTime = Number(Storage.get('registrationTime')) || 0;

        if (!isComplete && registrationTime) {
            const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
            const filters: I.Filter[] = [
                { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
                { operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: registrationTime + 30 },
            ];

            C.ObjectSearch(filters, [], [], '', 0, 50, (message: any) => {
                if (message.error.code) {
                    return;
                };

                if (message.records.length >= 50) {
                    this.show('fiftyObjects');
                };
            });
        };
    };
    
}

export default new Survey();