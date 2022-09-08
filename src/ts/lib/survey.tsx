import { I, Storage, Util, analytics, Renderer } from 'Lib';
import { popupStore, authStore } from 'Store';

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
    }
}

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
    }

    onConfirm (type) {
        const { account } = authStore;
        const survey = Surveys[type];

        Renderer.send('urlOpen', Util.sprintf(survey.url, account.id));
        analytics.event(survey.analyticsEvent);

        if (type === 'pmf') {
            Storage.set('lastSurveyTime', Util.time());
        }
    }

    onSkip (type) {
        if (type === 'pmf') {
            Storage.set('lastSurveyCanceled', 1);
            Storage.set('lastSurveyTime', Util.time());
        }
    }

}

export default new Survey();