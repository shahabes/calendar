import { translate as t } from '@nextcloud/l10n'
/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import moment from '@nextcloud/moment'
import { formatDate } from '../utils/dateFormatter.js'

/**
 * Formats a date-range depending on the user's current view
 *
 * @param {string | Date} value The date to format
 * @param {string} view The current view of the user
 * @param {string} locale Which locale to format it in
 * @return {string}
 */
export default (value, view, locale) => {
	switch (view) {
		case 'timeGridDay':
			return formatDate(value, 'll', locale)

		case 'timeGridWeek':
			return t('calendar', 'Week {number} of {year}', {
				number: moment(value).locale(locale).week(),
				year: moment(value).locale(locale).weekYear(),
			})

		case 'multiMonthYear':
			return formatDate(value, 'YYYY', locale)

		case 'dayGridMonth':
		case 'listMonth':
		default:
			return formatDate(value, 'MMMM YYYY', locale)
	}
}
