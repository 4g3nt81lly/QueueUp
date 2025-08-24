import type { PageRenderConfig } from '$/types';

export default {
	path: '/',
	render({ render }) {
		return render.renderHomePage();
	},
	postprocess({ templateHTML, renderResult }) {
		const { head = '', body } = renderResult;
		return templateHTML
			.replace('<!--home-head-->', head)
			.replace('<!--home-root-->', body);
	},
} satisfies PageRenderConfig;
