/** Rounds for display and uses a typographic minus sign, as in the printed equations. */
export function formatNumber(value: number, digits = 4) {
	const rounded = Number(value.toFixed(digits));
	const text = Object.is(rounded, -0) ? '0' : rounded.toString();
	return text.startsWith('-') ? `−${text.slice(1)}` : text;
}
