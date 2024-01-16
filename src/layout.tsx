import { FC } from "hono/jsx";

export const Layout: FC = (props) => {
	const title = props.title || 'ACES Batches';
	return (
		<html>
			<head>
				<title>{title}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script
					src="https://unpkg.com/htmx.org@1.9.10"
					integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC"
					crossorigin="anonymous"
				></script>
				<script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
				<link href="/static/css/styles.css" rel="stylesheet" />
			</head>
			<body hx-ext="reset-on-success">
				<div class="page">{props.children}</div>
				<div style="height:20rem"></div>
				<script src="/static/js/htmx-form-reset.js"></script>
				<script src="/static/js/commons.js"></script>
				{props.js && typeof props.js == 'string' && <script src={props.js}></script>}
				{props.js && Array.isArray(props.js) && props.js.map((s) => <script src={s}></script>)}
			</body>
		</html>
	);
};
