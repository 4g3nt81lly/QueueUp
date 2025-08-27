import emojiRegex from 'emoji-regex';

export default {
    USER_EMAIL: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	
	QROOM_CODE: /^\d{5}$/,
	QROOM_EMOJI: emojiRegex(),
};
