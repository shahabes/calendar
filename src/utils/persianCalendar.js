/**
 * Utilities for working with the Persian (Jalali) calendar without relying on
 * additional third-party packages. The conversion formulas are derived from
 * "Calendrical Calculations" by Nachum Dershowitz and Edward M. Reingold and
 * convert between Gregorian dates and the Jalali civil calendar used in Iran.
 *
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const PERSIAN_MONTHS = [
	'فروردین',
	'اردیبهشت',
	'خرداد',
	'تیر',
	'مرداد',
	'شهریور',
	'مهر',
	'آبان',
	'آذر',
	'دی',
	'بهمن',
	'اسفند',
]

const PERSIAN_MONTHS_SHORT = [
	'فرو',
	'ارد',
	'خرد',
	'تیر',
	'مرد',
	'شهر',
	'مهر',
	'آبا',
	'آذر',
	'دی',
	'بهم',
	'اسف',
]

const PERSIAN_WEEKDAYS = [
	'شنبه',
	'یک‌شنبه',
	'دوشنبه',
	'سه‌شنبه',
	'چهارشنبه',
	'پنج‌شنبه',
	'جمعه',
]

const PERSIAN_WEEKDAYS_SHORT = [
	'شن',
	'یک',
	'دو',
	'سه',
	'چه',
	'پن',
	'جم',
]

const PERSIAN_WEEKDAYS_MIN = [
	'ش',
	'ی',
	'د',
	'س',
	'چ',
	'پ',
	'ج',
]

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const LATIN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

const PERSIAN_EPOCH = 1948320.5
const GREGORIAN_EPOCH = 1721425.5

function mod(a, b) {
	return a - b * Math.floor(a / b)
}

function gregorianToJDN(year, month, day) {
	const a = Math.floor((14 - month) / 12)
	const y = year + 4800 - a
	const m = month + 12 * a - 3
	return day + Math.floor((153 * m + 2) / 5) + 365 * y
		+ Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function jdnToGregorian(jdn) {
	const wjd = Math.floor(jdn - 0.5) + 0.5
	const depoch = wjd - GREGORIAN_EPOCH
	const quadricent = Math.floor(depoch / 146097)
	const dqc = mod(depoch, 146097)
	const cent = Math.floor(dqc / 36524)
	const dcent = mod(dqc, 36524)
	const quad = Math.floor(dcent / 1461)
	const dquad = mod(dcent, 1461)
	const yindex = Math.floor(dquad / 365)

	let year = quadricent * 400 + cent * 100 + quad * 4 + yindex
	if (!(cent === 4 || yindex === 4)) {
		year += 1
	}

	const yearday = wjd - gregorianToJDN(year, 1, 1) + 1
	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
	let correction
	if (yearday <= (leap ? 60 : 59)) {
		correction = 0
	} else if (leap) {
		correction = 1
	} else {
		correction = 2
	}

	const month = Math.floor(((yearday + correction) * 12 + 373) / 367)
	const day = wjd - gregorianToJDN(year, month, 1) + 1

	return { year, month, day }
}

function persianToJDN(year, month, day) {
	const epBase = year - (year >= 0 ? 474 : 473)
	const epYear = 474 + mod(epBase, 2820)

	return day
		+ (month <= 7 ? (month - 1) * 31 : (month - 1) * 30 + 6)
		+ Math.floor((epYear * 682 - 110) / 2816)
		+ (epYear - 1) * 365
		+ Math.floor(epBase / 2820) * 1029983
		+ (PERSIAN_EPOCH - 1)
}

function jdnToPersian(jdn) {
	const depoch = Math.floor(jdn) + 0.5 - persianToJDN(475, 1, 1)
	const cycle = Math.floor(depoch / 1029983)
	const cyear = mod(depoch, 1029983)

	let ycycle
	if (cyear === 1029982) {
		ycycle = 2820
	} else {
		const aux1 = Math.floor(cyear / 366)
		const aux2 = mod(cyear, 366)
		ycycle = Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1
	}

	let year = ycycle + 2820 * cycle + 474
	if (year <= 0) {
		year -= 1
	}

	const newYearDay = persianToJDN(year, 1, 1)
	const dayOfYear = Math.floor(jdn) + 0.5 - newYearDay + 1

	let month
	let day
	if (dayOfYear <= 186) {
		month = Math.ceil(dayOfYear / 31)
		day = dayOfYear - (month - 1) * 31
	} else {
		month = Math.ceil((dayOfYear - 6) / 30)
		day = dayOfYear - 186 - (month - 7) * 30
		month += 6
	}

	return { year, month, day }
}

function gregorianToJalali(date) {
	const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate())
	return jdnToPersian(jdn)
}

function jalaliToGregorian(year, month, day) {
	const jdn = persianToJDN(year, month, day)
	return jdnToGregorian(jdn)
}

function jalaliMonthLength(year, month) {
	if (month <= 6) {
		return 31
	}
	if (month <= 11) {
		return 30
	}
	const thisNewYear = persianToJDN(year, 1, 1)
	const nextNewYear = persianToJDN(year + 1, 1, 1)
	return nextNewYear - thisNewYear - 365 === 0 ? 29 : 30
}

function toPersianDigits(value) {
	return value.toString().split('').map((char) => {
		const index = LATIN_DIGITS.indexOf(char)
		if (index === -1) {
			return char
		}
		return PERSIAN_DIGITS[index]
	}).join('')
}

function clampJalaliSelection(year, month, day, min, max) {
	if (!min && !max) {
		return { year, month, day }
	}
	const selectionJdn = persianToJDN(year, month, day)
	if (min) {
		const minJdn = persianToJDN(min.year, min.month, min.day)
		if (selectionJdn < minJdn) {
			return { ...min }
		}
	}
	if (max) {
		const maxJdn = persianToJDN(max.year, max.month, max.day)
		if (selectionJdn > maxJdn) {
			return { ...max }
		}
	}
	return { year, month, day }
}

export {
	clampJalaliSelection,
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	PERSIAN_DIGITS,
	PERSIAN_MONTHS,
	PERSIAN_MONTHS_SHORT,
	PERSIAN_WEEKDAYS,
	PERSIAN_WEEKDAYS_MIN,
	PERSIAN_WEEKDAYS_SHORT,
	toPersianDigits,
}
