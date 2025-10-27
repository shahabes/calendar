import {
        getDayNames,
        getDayNamesMin,
        getDayNamesShort,
        getFirstDay,
        getMonthNames,
        getMonthNamesShort,
} from '@nextcloud/l10n'
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import moment from '@nextcloud/moment'
import {
        PERSIAN_MONTHS,
        PERSIAN_MONTHS_SHORT,
        PERSIAN_WEEKDAYS,
        PERSIAN_WEEKDAYS_MIN,
        PERSIAN_WEEKDAYS_SHORT,
} from './persianCalendar.js'

/**
 * Maps a moment locale to a vue2-datepicker locale
 *
 * See https://github.com/mengxiong10/vue2-datepicker/blob/master/locale.md
 *
 * @param {string} momentLocale Name of the moment locale
 * @return {object} The vue2-datepicker lang object
 */
function getLangConfigForVue2DatePicker(momentLocale) {
        const localeData = moment.localeData(momentLocale)
        const dateFormat = localeData
                .longDateFormat('L')
                .toUpperCase()

        const usePersianCalendar = momentLocale?.startsWith('fa')

        return {
                formatLocale: {
                        months: usePersianCalendar ? PERSIAN_MONTHS : getMonthNames(),
                        monthsShort: usePersianCalendar ? PERSIAN_MONTHS_SHORT : getMonthNamesShort(),
                        weekdays: usePersianCalendar ? PERSIAN_WEEKDAYS : getDayNames(),
                        weekdaysShort: usePersianCalendar ? PERSIAN_WEEKDAYS_SHORT : getDayNamesShort(),
                        weekdaysMin: usePersianCalendar ? PERSIAN_WEEKDAYS_MIN : getDayNamesMin(),
                        firstDayOfWeek: getFirstDay(),
                        firstWeekContainsDate: localeData.firstDayOfYear(),
                        meridiem: localeData.meridiem,
                        meridiemParse: localeData.meridiemParse,
                        isPM: localeData.isPM,
                },
                yearFormat: 'YYYY',
                monthFormat: 'MMM',
                monthBeforeYear: dateFormat.indexOf('M') < dateFormat.indexOf('Y'),
        }
}

export {
	getLangConfigForVue2DatePicker,
}
