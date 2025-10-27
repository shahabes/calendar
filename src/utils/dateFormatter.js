import moment from '@nextcloud/moment'
import { toPersianDigits } from './persianCalendar.js'

const PERSIAN_INTL_LOCALE = 'fa-IR-u-ca-persian'

function usesPersianCalendar(locale) {
	return locale?.startsWith('fa')
}

function toMoment(value, timezoneOffset) {
	let m = moment(value)
	if (timezoneOffset !== undefined && timezoneOffset !== null) {
		m = m.utcOffset(timezoneOffset)
	}
	return m
}

function formatWithIntl(date, options) {
	return new Intl.DateTimeFormat(PERSIAN_INTL_LOCALE, options).format(date)
}

function formatPersianDate(date, format) {
	const formats = {
		L: () => formatWithIntl(date, { dateStyle: 'short' }),
		l: () => formatWithIntl(date, { dateStyle: 'short' }),
		LL: () => formatWithIntl(date, { dateStyle: 'long' }),
		ll: () => formatWithIntl(date, { dateStyle: 'medium' }),
		LLL: () => formatWithIntl(date, { dateStyle: 'long', timeStyle: 'short' }),
		lll: () => formatWithIntl(date, { dateStyle: 'medium', timeStyle: 'short' }),
		LLLL: () => formatWithIntl(date, { dateStyle: 'full', timeStyle: 'short' }),
		LLLL_date: () => formatWithIntl(date, { dateStyle: 'full' }),
		LT: () => formatWithIntl(date, { hour: 'numeric', minute: '2-digit' }),
		LTS: () => formatWithIntl(date, { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
		dddd: () => formatWithIntl(date, { weekday: 'long' }),
		ddd: () => formatWithIntl(date, { weekday: 'short' }),
		MMMM: () => formatWithIntl(date, { month: 'long' }),
		MMM: () => formatWithIntl(date, { month: 'short' }),
		'MMMM D': () => formatWithIntl(date, { month: 'long', day: 'numeric' }),
		'MMMM D, YYYY': () => {
			const datePart = formatWithIntl(date, { month: 'long', day: 'numeric' })
			const yearPart = formatWithIntl(date, { year: 'numeric' })
			return `${datePart}، ${yearPart}`
		},
		'MMMM YYYY': () => formatWithIntl(date, { month: 'long', year: 'numeric' }),
		'dddd, MMMM D': () => {
			const weekday = formats.dddd()
			const monthDay = formats['MMMM D']()
			return `${weekday}، ${monthDay}`
		},
		'dddd, MMMM Do': () => formats['dddd, MMMM D'](),
		'dddd, MMMM D, LT': () => {
			const datePart = formats['dddd, MMMM D']()
			const timePart = formats.LT()
			return `${datePart}، ${timePart}`
		},
		'LL, dddd': () => {
			const datePart = formats.LL()
			const weekday = formats.dddd()
			return `${datePart}، ${weekday}`
		},
		'ddd l': () => {
			const weekday = formats.ddd()
			const shortDate = formats.l()
			return `${weekday} ${shortDate}`
		},
		'L LT': () => {
			const shortDate = formats.L()
			const time = formats.LT()
			return `${shortDate} ${time}`
		},
		D: () => formatWithIntl(date, { day: 'numeric' }),
		YYYY: () => formatWithIntl(date, { year: 'numeric' }),
	}

	if (formats[format]) {
		return formats[format]()
	}

	if (format.includes(' ')) {
		return format.split(' ').map((token) => formatPersianDate(date, token)).join(' ')
	}

	return formatWithIntl(date, { dateStyle: 'medium', timeStyle: format.includes('T') ? 'short' : undefined })
}

function formatDate(value, format, locale, { timezoneOffset } = {}) {
	const momentInstance = toMoment(value, timezoneOffset)
	if (!momentInstance.isValid()) {
		return ''
	}
	if (!format) {
		return momentInstance.locale(locale).format()
	}

	if (!usesPersianCalendar(locale)) {
		return momentInstance.locale(locale).format(format)
	}

	const formatted = formatPersianDate(momentInstance.toDate(), format)

	if (format.includes('w') || format.includes('W')) {
		return toPersianDigits(formatted)
	}

	return formatted
}

export {
	formatDate,
	usesPersianCalendar,
}
