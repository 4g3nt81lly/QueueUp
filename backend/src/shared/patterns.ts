import emojiRegex from 'emoji-regex';
import Constants from './constants';

export default {
	AUTHORIZATION_HEADER: /^Bearer (?<token>[\w-]+\.[\w-]+\.[\w-]+)$/,

	USER_EMAIL:
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

	QROOM_CODE: new RegExp(`^\\d{${Constants.QROOM_CODE_LENGTH}}$`),
	QROOM_EMOJI: emojiRegex(),
};
