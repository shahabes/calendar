<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div>
		<div
			v-if="isPersianDateMode"
			class="date-time-picker persian-date-picker"
			role="group"
			:aria-label="$t('calendar', 'Select a date')">
			<label class="persian-date-picker__segment">
				<span class="persian-date-picker__segment-label">{{ $t('calendar', 'Year') }}</span>
				<select
					v-model.number="persianYear"
					class="persian-date-picker__select"
					lang="fa-IR"
					:aria-label="$t('calendar', 'Select year')">
					<option
						v-for="year in availablePersianYears"
						:key="year"
						:value="year">
						{{ formatPersianNumber(year) }}
					</option>
				</select>
			</label>
			<label class="persian-date-picker__segment">
				<span class="persian-date-picker__segment-label">{{ $t('calendar', 'Month') }}</span>
				<select
					v-model.number="persianMonth"
					class="persian-date-picker__select"
					lang="fa-IR"
					:aria-label="$t('calendar', 'Select month')">
					<option
						v-for="month in availablePersianMonths"
						:key="month.value"
						:value="month.value">
						{{ month.label }}
					</option>
				</select>
			</label>
			<label class="persian-date-picker__segment">
				<span class="persian-date-picker__segment-label">{{ $t('calendar', 'Day') }}</span>
				<select
					v-model.number="persianDay"
					class="persian-date-picker__select"
					lang="fa-IR"
					:aria-label="$t('calendar', 'Select day')">
					<option
						v-for="day in availablePersianDays"
						:key="day.value"
						:value="day.value">
						{{ day.label }}
					</option>
				</select>
			</label>
		</div>
		<DateTimePicker
			v-else
			id="date-time-picker-input"
			:min="minimumDate"
			:max="maximumDate"
			:value="date"
			:type="type"
			:hide-label="true"
			class="date-time-picker"
			@blur="onBlur"
			@input="onInput" />
	</div>
</template>

<script>
import {
	NcDateTimePickerNative as DateTimePicker,
} from '@nextcloud/vue'
import { mapState, mapStores } from 'pinia'
import useDavRestrictionsStore from '../../store/davRestrictions.js'
import useSettingsStore from '../../store/settings.js'
import {
	clampJalaliSelection,
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	PERSIAN_MONTHS,
	toPersianDigits,
} from '../../utils/persianCalendar.js'

export default {
	name: 'DatePicker',
	components: {
		DateTimePicker,
	},

	props: {
		date: {
			type: Date,
			required: true,
		},

		prefix: {
			type: String,
			default: null,
		},

		min: {
			type: Date,
			default: null,
		},

		max: {
			type: Date,
			default: null,
		},

		type: {
			type: String,
			default: 'date',
		},
	},

	data() {
		return {
			pendingDate: null,
			persianYear: null,
			persianMonth: null,
			persianDay: null,
			initializingPersianSelection: false,
			updatingPersianSelection: false,
		}
	},

	computed: {
		...mapStores(useDavRestrictionsStore),
		...mapState(useSettingsStore, {
			momentLocale: 'momentLocale',
		}),

		/**
		 * The earliest date a user is allowed to pick in the timezone
		 *
		 * @return {Date}
		 */
		minimumDate() {
			return this.min || new Date(this.davRestrictionsStore.minimumDate)
		},

		/**
		 * The latest date a user is allowed to pick in the timezone
		 *
		 * @return {Date}
		 */
		maximumDate() {
			return this.max || new Date(this.davRestrictionsStore.maximumDate)
		},

		usePersianCalendar() {
			return this.momentLocale?.startsWith('fa') ?? false
		},

		isPersianDateMode() {
			return this.usePersianCalendar && this.type === 'date'
		},

		persianMinimum() {
			if (!this.isPersianDateMode) {
				return null
			}
			return this.minimumDate ? gregorianToJalali(this.minimumDate) : null
		},

		persianMaximum() {
			if (!this.isPersianDateMode) {
				return null
			}
			return this.maximumDate ? gregorianToJalali(this.maximumDate) : null
		},

		availablePersianYears() {
			if (!this.isPersianDateMode) {
				return []
			}
			const min = this.persianMinimum
			const max = this.persianMaximum
			const startYear = min ? min.year : gregorianToJalali(this.minimumDate).year
			const endYear = max ? max.year : gregorianToJalali(this.maximumDate).year
			const years = []
			for (let year = startYear; year <= endYear; year++) {
				years.push(year)
			}
			return years
		},

		availablePersianMonths() {
			if (!this.isPersianDateMode || this.persianYear === null) {
				return []
			}
			const min = this.persianMinimum
			const max = this.persianMaximum
			let start = 1
			let end = 12
			if (min && this.persianYear === min.year) {
				start = min.month
			}
			if (max && this.persianYear === max.year) {
				end = max.month
			}
			const months = []
			for (let month = start; month <= end; month++) {
				months.push({
					value: month,
					label: PERSIAN_MONTHS[month - 1],
				})
			}
			return months
		},

		availablePersianDays() {
			if (!this.isPersianDateMode || this.persianYear === null || this.persianMonth === null) {
				return []
			}
			const min = this.persianMinimum
			const max = this.persianMaximum
			let start = 1
			let end = jalaliMonthLength(this.persianYear, this.persianMonth)
			if (min && this.persianYear === min.year && this.persianMonth === min.month) {
				start = Math.max(start, min.day)
			}
			if (max && this.persianYear === max.year && this.persianMonth === max.month) {
				end = Math.min(end, max.day)
			}
			const days = []
			for (let day = start; day <= end; day++) {
				const formatted = toPersianDigits(day.toString().padStart(2, '0'))
				days.push({ value: day, label: formatted })
			}
			return days
		},
	},

	watch: {
		date: {
			handler(newDate) {
				this.initializePersianSelection(newDate)
			},

			immediate: true,
		},

		isPersianDateMode(newVal) {
			if (newVal) {
				this.initializePersianSelection(this.date)
			}
		},

		persianYear() {
			if (!this.isPersianDateMode || this.initializingPersianSelection) {
				return
			}
			this.ensurePersianMonthWithinRange()
			this.ensurePersianDayWithinRange()
			this.emitPersianSelection()
		},

		persianMonth() {
			if (!this.isPersianDateMode || this.initializingPersianSelection) {
				return
			}
			this.ensurePersianDayWithinRange()
			this.emitPersianSelection()
		},

		persianDay() {
			if (!this.isPersianDateMode || this.initializingPersianSelection) {
				return
			}
			this.emitPersianSelection()
		},
	},

	methods: {
		/**
		 * Emits a change event for the Date
		 *
		 * @param {Date} date The new Date object
		 */
		onInput(date) {
			// Buffer the input; only emit when the user leaves the field
			if (this.disabledDate(date)) {
				return
			}
			this.pendingDate = date
		},

		onBlur(event) {
			// When focus leaves the picker, commit the pending date
			if (this.pendingDate === undefined || this.pendingDate === null) {
				return
			}
			const pending = this.pendingDate
			this.pendingDate = null
			if (this.disabledDate(pending)) {
				return
			}
			this.$emit('change', pending)
		},

		/**
		 * Whether or not the date is acceptable
		 *
		 * @param {Date} date The date to compare to
		 * @return {boolean}
		 */
		disabledDate(date) {
			return date < this.minimumDate || date > this.maximumDate
		},

		formatPersianNumber(value) {
			return toPersianDigits(value.toString())
		},

		initializePersianSelection(date) {
			if (!this.isPersianDateMode || !(date instanceof Date) || Number.isNaN(date.getTime())) {
				return
			}
			this.initializingPersianSelection = true
			const base = gregorianToJalali(date)
			const min = this.persianMinimum
			const max = this.persianMaximum
			const { year, month, day } = clampJalaliSelection(base.year, base.month, base.day, min, max)
			this.persianYear = year
			this.persianMonth = month
			this.persianDay = day
			this.initializingPersianSelection = false
		},

		ensurePersianMonthWithinRange() {
			if (!this.isPersianDateMode || this.initializingPersianSelection || this.persianYear === null) {
				return
			}
			const months = this.availablePersianMonths
			if (!months.length) {
				return
			}
			const values = months.map((month) => month.value)
			const min = values[0]
			const max = values[values.length - 1]
			if (this.persianMonth === null || this.persianMonth < min || this.persianMonth > max) {
				this.updatingPersianSelection = true
				this.persianMonth = min
				this.updatingPersianSelection = false
			}
		},

		ensurePersianDayWithinRange() {
			if (!this.isPersianDateMode || this.initializingPersianSelection) {
				return
			}
			const days = this.availablePersianDays
			if (!days.length) {
				return
			}
			const min = days[0].value
			const max = days[days.length - 1].value
			if (this.persianDay === null || this.persianDay < min || this.persianDay > max) {
				this.updatingPersianSelection = true
				this.persianDay = Math.min(Math.max(min, this.persianDay ?? min), max)
				this.updatingPersianSelection = false
			}
		},

		emitPersianSelection() {
			if (!this.isPersianDateMode || this.initializingPersianSelection || this.updatingPersianSelection) {
				return
			}
			if (this.persianYear === null || this.persianMonth === null || this.persianDay === null) {
				return
			}
			const min = this.persianMinimum
			const max = this.persianMaximum
			const clamped = clampJalaliSelection(this.persianYear, this.persianMonth, this.persianDay, min, max)
			if (clamped.year !== this.persianYear || clamped.month !== this.persianMonth || clamped.day !== this.persianDay) {
				this.updatingPersianSelection = true
				this.persianYear = clamped.year
				this.persianMonth = clamped.month
				this.persianDay = clamped.day
				this.updatingPersianSelection = false
				return
			}

			const { year, month, day } = jalaliToGregorian(this.persianYear, this.persianMonth, this.persianDay)
			const updated = new Date(this.date.getTime())
			updated.setFullYear(year, month - 1, day)

			if (this.disabledDate(updated)) {
				return
			}

			this.$emit('change', updated)
		},
	},
}
</script>

<style lang="scss" scoped>
.persian-date-picker {
display: flex;
gap: 8px;
align-items: flex-end;

&__segment {
display: flex;
flex-direction: column;
gap: 4px;
flex: 1 1 0;
}

&__segment-label {
font-size: 0.75rem;
color: var(--color-text-lighter);
}

&__select {
width: 100%;
padding: 6px 8px;
border-radius: var(--border-radius-pill);
border: 1px solid var(--color-border);
background-color: var(--color-main-background);
color: var(--color-main-text);

&:focus {
outline: 2px solid var(--color-primary-element);
outline-offset: 1px;
}
}
}
</style>
