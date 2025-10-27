<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { isRTL as isRTLFn, t } from '@nextcloud/l10n'
import { NcButton } from '@nextcloud/vue'
import { useHotKey } from '@nextcloud/vue/composables/useHotKey'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router/composables'
import ChevronLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import DatePicker from '../../Shared/DatePickerOld.vue'
import formatDateRange from '../../../filters/dateRangeFormat.js'
import useSettingsStore from '../../../store/settings.js'
import useWidgetStore from '../../../store/widget.js'
import {
	getDateFromFirstdayParam,
	getYYYYMMDDFromDate,
	modifyDate,
} from '../../../utils/date.js'
import {
	gregorianToJalali,
	jalaliMonthLength,
	jalaliToGregorian,
	PERSIAN_MONTHS,
	toPersianDigits,
} from '../../../utils/persianCalendar.js'

const props = defineProps<{
	isWidget?: boolean
}>()

const route = useRoute()
const router = useRouter()

const isDatepickerOpen = ref(false)

const widgetStore = useWidgetStore()
const settingsStore = useSettingsStore()
const isRTL = computed(() => isRTLFn())
const usePersianCalendar = computed(() => settingsStore.momentLocale?.startsWith('fa') ?? false)

const selectedDate = computed<Date>(() => {
	if (props.isWidget) {
		return getDateFromFirstdayParam(widgetStore.widgetDate)
	}
	return getDateFromFirstdayParam(route.params?.firstDay ?? 'now')
})

const view = computed<string>(() => {
	if (props.isWidget) {
		return widgetStore.widgetView
	}
	return route.params.view
})

const formattedSelectedDate = computed<string>(() => formatDateRange(selectedDate.value, view.value, settingsStore.momentLocale))
const isYearPicker = computed(() => view.value === 'multiMonthYear')

const persianYear = ref<number | null>(null)
const persianMonth = ref<number | null>(null)
const persianDay = ref<number | null>(null)
const persianPickerWrapper = ref<HTMLElement | null>(null)
const initializingPersianSelection = ref(false)

const basePersianYear = computed(() => {
	const date = selectedDate.value
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		return new Date().getFullYear()
	}
	return gregorianToJalali(date).year
})

const availablePersianYears = computed(() => {
	const center = persianYear.value ?? basePersianYear.value
	const years = [] as Array<{ value: number, label: string }>
	const start = Math.max(1, center - 75)
	const end = center + 75
	for (let year = start; year <= end; year++) {
		years.push({ value: year, label: toPersianDigits(year.toString()) })
	}
	return years
})

const availablePersianMonths = computed(() => {
	if (isYearPicker.value) {
		return [] as Array<{ value: number, label: string }>
	}
	if (persianYear.value === null) {
		return [] as Array<{ value: number, label: string }>
	}
	return PERSIAN_MONTHS.map((label, index) => ({ value: index + 1, label }))
})

const availablePersianDays = computed(() => {
	if (isYearPicker.value) {
		return [] as Array<{ value: number, label: string }>
	}
	if (persianYear.value === null || persianMonth.value === null) {
		return [] as Array<{ value: number, label: string }>
	}
	const length = jalaliMonthLength(persianYear.value, persianMonth.value)
	const days = [] as Array<{ value: number, label: string }>
	for (let day = 1; day <= length; day++) {
		days.push({ value: day, label: toPersianDigits(day.toString().padStart(2, '0')) })
	}
	return days
})

function initializePersianSelection(date: Date | null): void {
	if (!usePersianCalendar.value || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		return
	}
	const base = gregorianToJalali(date)
	initializingPersianSelection.value = true
	persianYear.value = base.year
	if (isYearPicker.value) {
		persianMonth.value = 1
		persianDay.value = 1
	} else {
		persianMonth.value = base.month
		persianDay.value = base.day
	}
	initializingPersianSelection.value = false
}

function ensurePersianDayWithinRange(): void {
	if (isYearPicker.value || persianYear.value === null || persianMonth.value === null) {
		return
	}
	const length = jalaliMonthLength(persianYear.value, persianMonth.value)
	if (persianDay.value === null || persianDay.value > length) {
		persianDay.value = length
	} else if (persianDay.value < 1) {
		persianDay.value = 1
	}
}

function applyPersianSelection(): void {
	if (!usePersianCalendar.value || persianYear.value === null) {
		return
	}
	let targetYearMonthDay
	if (isYearPicker.value) {
		targetYearMonthDay = jalaliToGregorian(persianYear.value, 1, 1)
	} else {
		if (persianMonth.value === null || persianDay.value === null) {
			return
		}
		targetYearMonthDay = jalaliToGregorian(persianYear.value, persianMonth.value, persianDay.value)
	}

	const updated = new Date(selectedDate.value.getTime())
	updated.setFullYear(targetYearMonthDay.year, targetYearMonthDay.month - 1, targetYearMonthDay.day)
	void navigateToDate(updated)
	isDatepickerOpen.value = false
}

function handleDocumentClick(event: MouseEvent): void {
	if (!isDatepickerOpen.value || !usePersianCalendar.value) {
		return
	}
	const wrapper = persianPickerWrapper.value
	if (!wrapper) {
		return
	}
	if (event.target instanceof Node && !wrapper.contains(event.target)) {
		isDatepickerOpen.value = false
	}
}

const previousLabel = computed(() => {
	switch (view.value) {
		case 'timeGridDay':
			return t('calendar', 'Previous day')

		case 'timeGridWeek':
			return t('calendar', 'Previous week')

		case 'multiMonthYear':
			return t('calendar', 'Previous year')

		case 'dayGridMonth':
		default:
			return t('calendar', 'Previous month')
	}
})

const nextLabel = computed(() => {
	switch (view.value) {
		case 'timeGridDay':
			return t('calendar', 'Next day')

		case 'timeGridWeek':
			return t('calendar', 'Next week')

		case 'multiMonthYear':
			return t('calendar', 'Next year')

		case 'dayGridMonth':
		default:
			return t('calendar', 'Next month')
	}
})

function navigateTimeRangeForward(): void {
	navigateTimeRangeByFactor(1)
}

function navigateTimeRangeBackward(): void {
	navigateTimeRangeByFactor(-1)
}

function navigateTimeRangeByFactor(factor: number): void {
	let newDate: Date | undefined

	switch (route.params.view) {
		case 'timeGridDay':
			newDate = modifyDate(selectedDate.value, {
				day: factor,
			})
			break

		case 'timeGridWeek':
			newDate = modifyDate(selectedDate.value, {
				week: factor,
			})
			break

		case 'multiMonthYear':
			newDate = modifyDate(selectedDate.value, {
				year: factor,
			})
			break

		case 'dayGridMonth':
		case 'listMonth':
		default: {
		// modifyDate is just adding one month, so we have to manually
		// set the date of month to 1. Otherwise if your date is set to
		// January 30th and you add one month, February 30th doesn't exist
		// and it automatically changes to March 1st. Same happens on March 31st.
			const firstDayOfCurrentMonth = new Date(selectedDate.value.getTime())
			firstDayOfCurrentMonth.setDate(1)
			newDate = modifyDate(firstDayOfCurrentMonth, {
				month: factor,
			})
			break
		}
	}

	// newDate is always set at this point
	// TODO: migrate modifyDate() to TypeScript to fix typing
	navigateToDate(newDate!)
}

async function navigateToDate(date: Date): Promise<void> {
	if (props.isWidget) {
		widgetStore.setWidgetDate({ widgetDate: getYYYYMMDDFromDate(date) })
	} else {
		// Don't push new route when day didn't change
		if (route.params.firstDay === getYYYYMMDDFromDate(date)) {
			return
		}

		const name = route.name!
		const params = {
			...route.params,
			firstDay: getYYYYMMDDFromDate(date),
		}

		await router.push({ name, params })
	}
}

function toggleDatepicker() {
	isDatepickerOpen.value = !isDatepickerOpen.value
}

useHotKey(['n', 'j'], () => navigateTimeRangeForward())
useHotKey(['p', 'k'], () => navigateTimeRangeBackward())

watch(() => selectedDate.value, (newDate) => {
	if (usePersianCalendar.value) {
		initializePersianSelection(newDate)
	}
})

watch(usePersianCalendar, (enabled) => {
	if (enabled) {
		initializePersianSelection(selectedDate.value)
	}
})

watch(isYearPicker, () => {
	if (usePersianCalendar.value) {
		initializePersianSelection(selectedDate.value)
	}
})

watch(isDatepickerOpen, (open) => {
	if (open && usePersianCalendar.value) {
		initializePersianSelection(selectedDate.value)
	}
})

watch(persianMonth, () => {
	if (!usePersianCalendar.value || initializingPersianSelection.value || isYearPicker.value) {
		return
	}
	ensurePersianDayWithinRange()
})

watch(persianYear, () => {
	if (!usePersianCalendar.value || initializingPersianSelection.value) {
		return
	}
	ensurePersianDayWithinRange()
})

onMounted(() => {
	document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
	document.removeEventListener('click', handleDocumentClick)
})

if (usePersianCalendar.value) {
	initializePersianSelection(selectedDate.value)
}
</script>

<template>
	<div class="datepicker-button-section">
		<NcButton
			v-if="!props.isWidget"
			:aria-label="isRTL ? nextLabel : previousLabel"
			class="button"
			:class="{ 'datepicker-button-section__right': isRTL, 'datepicker-button-section__left': !isRTL }"
			:name="isRTL ? nextLabel : previousLabel"
			@click="navigateTimeRangeBackward">
			<template #icon>
				<ChevronRightIcon v-if="isRTL" :size="22" />
				<ChevronLeftIcon v-else :size="22" />
			</template>
		</NcButton>
		<NcButton
			v-if="!props.isWidget"
			class="datepicker-button-section__datepicker-label button datepicker-label"
			@click.stop.prevent="toggleDatepicker"
			@mousedown.stop.prevent="() => {}"
			@mouseup.stop.prevent="() => {}">
			{{ formattedSelectedDate }}
		</NcButton>
		<div class="datepicker-button-section__picker-wrapper">
			<DatePicker
				v-if="!usePersianCalendar"
				:class="props.isWidget ? 'datepicker-widget' : 'datepicker-button-section__datepicker'"
				:append-to-body="props.isWidget"
				:date="selectedDate"
				:is-all-day="true"
				:open.sync="isDatepickerOpen"
				:type="view === 'multiMonthYear' ? 'year' : 'date'"
				@change="navigateToDate" />
			<div
				v-else
				ref="persianPickerWrapper"
				class="datepicker-button-section__persian-picker"
				:class="props.isWidget ? 'datepicker-widget' : 'datepicker-button-section__datepicker'">
				<div
					v-show="isDatepickerOpen"
					class="persian-date-popover"
					@click.stop
					@mousedown.stop>
					<div class="persian-date-popover__content">
						<label class="persian-date-popover__segment">
							<span class="persian-date-popover__segment-label">{{ t('calendar', 'Year') }}</span>
							<select v-model.number="persianYear" class="persian-date-popover__select" lang="fa-IR">
								<option
									v-for="year in availablePersianYears"
									:key="year.value"
									:value="year.value">
									{{ year.label }}
								</option>
							</select>
						</label>
						<template v-if="!isYearPicker">
							<label class="persian-date-popover__segment">
								<span class="persian-date-popover__segment-label">{{ t('calendar', 'Month') }}</span>
								<select v-model.number="persianMonth" class="persian-date-popover__select" lang="fa-IR">
									<option
										v-for="month in availablePersianMonths"
										:key="month.value"
										:value="month.value">
										{{ month.label }}
									</option>
								</select>
							</label>
							<label class="persian-date-popover__segment">
								<span class="persian-date-popover__segment-label">{{ t('calendar', 'Day') }}</span>
								<select v-model.number="persianDay" class="persian-date-popover__select" lang="fa-IR">
									<option
										v-for="day in availablePersianDays"
										:key="day.value"
										:value="day.value">
										{{ day.label }}
									</option>
								</select>
							</label>
						</template>
					</div>
					<div class="persian-date-popover__actions">
						<NcButton
							size="small"
							type="button"
							variant="primary"
							class="persian-date-popover__apply"
							@click="applyPersianSelection">
							{{ t('calendar', 'Done') }}
						</NcButton>
					</div>
				</div>
			</div>
		</div>
		<NcButton
			v-if="!props.isWidget"
			:aria-label="isRTL ? previousLabel : nextLabel"
			class="button"
			:class="{ 'datepicker-button-section__right': !isRTL, 'datepicker-button-section__left': isRTL }"
			:name="isRTL ? previousLabel : nextLabel"
			@click="navigateTimeRangeForward">
			<template #icon>
				<ChevronLeftIcon v-if="isRTL" :size="22" />
				<ChevronRightIcon v-else :size="22" />
			</template>
		</NcButton>
	</div>
</template>

<style lang="scss">
.datepicker-widget{
	width: 135px;
    margin: 2px 5px 5px 5px;
}

.datepicker-button-section__picker-wrapper {
	position: relative;
}

.datepicker-button-section__persian-picker {
	position: relative;
}

.persian-date-popover {
	position: absolute;
	inset-inline-start: 0;
	top: 100%;
	margin-top: 4px;
	background-color: var(--color-main-background);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-large);
	box-shadow: var(--shadow-elevation-2);
	padding: 12px;
	z-index: 2000;
	min-width: 240px;
}

.persian-date-popover__content {
	display: flex;
	gap: 8px;
	align-items: flex-end;
}

.persian-date-popover__segment {
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1 1 0;
}

.persian-date-popover__segment-label {
	font-size: 0.75rem;
	color: var(--color-text-lighter);
}

.persian-date-popover__select {
	width: 100%;
	padding: 6px 8px;
	border-radius: var(--border-radius-pill);
	border: 1px solid var(--color-border);
	background-color: var(--color-main-background);
	color: var(--color-main-text);
}

.persian-date-popover__select:focus {
	outline: 2px solid var(--color-primary-element);
	outline-offset: 1px;
}

.persian-date-popover__actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 12px;
}

.persian-date-popover__apply {
	min-width: 90px;
}
</style>
