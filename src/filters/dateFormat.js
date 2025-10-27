/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { formatDate } from '../utils/dateFormatter.js'

/**
 * Formats a date object
 *
 * @param {Date} value The date object to format
 * @param {boolean} isAllDay Whether or not to display only the date part
 * @param {string} locale The locale to format it in
 * @return {string}
 */
export default (value, isAllDay, locale) => {
	if (isAllDay) {
		return formatDate(value, 'll', locale)
	} else {
		return formatDate(value, 'lll', locale)
	}
}
