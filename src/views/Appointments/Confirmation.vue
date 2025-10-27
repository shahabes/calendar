<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="update">
		{{ $t('calendar', 'The slot for your appointment has been confirmed') }}
		<br>
		<br>
		{{ $t('calendar', 'Appointment Details:') }}
		<br>
		{{ $t('calendar', 'Time:') }} <b>{{ startDate }}</b> - <b>{{ endDate }}</b>
		<br>
		{{ $t('calendar', 'Booked for:') }} {{ booking.displayName }} ({{ booking.email }})
		<br>
		<br>
	</div>
</template>

<script>
import moment from '@nextcloud/moment'
import { mapState } from 'pinia'
import useSettingsStore from '../../store/settings.js'
import { formatDate } from '../../utils/dateFormatter.js'

export default {
	name: 'Confirmation',
	props: {
		booking: {
			required: true,
			type: Object,
		},
	},

	computed: {
		...mapState(useSettingsStore, {
			locale: 'momentLocale',
		}),

		startDate() {
			return formatDate(moment(this.booking.start * 1000).toDate(), 'LLL', this.locale)
		},

		endDate() {
			return formatDate(moment(this.booking.end * 1000).toDate(), 'LLL', this.locale)
		},
	},
}
</script>
