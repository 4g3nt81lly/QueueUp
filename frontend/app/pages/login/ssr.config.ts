import type { PageRenderConfig } from '$/types';

export default {
	path: '/login',
	render({ render }) {
		return render.renderLoginPage();
	},
	postprocess({ templateHTML, renderResult }) {
		const { body } = renderResult;
		return templateHTML.replace('<!--login-root-->', body);
	},
} satisfies PageRenderConfig;
