import { createPlugin } from '@fullcalendar/core'
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import moment from '@nextcloud/moment'
import useSettingsStore from '../../store/settings.js'
import { formatDate, usesPersianCalendar } from '../../utils/dateFormatter.js'

function formatDateInfo(cmdStr, dateInfo) {
	const settingsStore = useSettingsStore()
	const locale = settingsStore.momentLocale

	if (usesPersianCalendar(locale)) {
		const jsDate = moment(dateInfo.array).toDate()
		return formatDate(jsDate, cmdStr, locale)
	}

	return moment(dateInfo.array).locale(locale).format(cmdStr)
}

/**
 * Formats a date with given cmdStr
 *
 * @param {string} cmdStr The formatting string
 * @param {object} arg An Object containing the date, etc.
 * @return {function(string, string):string} cmdFormatter function
 */
function cmdFormatter(cmdStr, arg) {
	// With our specific DateFormattingConfig,
	// cmdStr will always be a moment parsable string
	// like LT, etc.
	//
	// No need to manually parse it.
	//
	// This is not the case, if you use the standard FC
	// formatting config.

	// If arg.end is defined, this is a time-range
	if (arg.end) {
		const start = formatDateInfo(cmdStr, arg.start)
		const end = formatDateInfo(cmdStr, arg.end)

		if (start === end) {
			return start
		}

		return start + arg.defaultSeparator + end
	}

	return formatDateInfo(cmdStr, arg.start)
}

export default createPlugin({
	name: '@nextcloud/moment-plugin',
	cmdFormatter,
})
