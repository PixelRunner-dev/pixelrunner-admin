<script setup lang="ts">
import type { CalendarOptions } from '../composables/use-calendar'
import { computed, watch } from 'vue'
import { useCalendar } from '../composables/use-calendar'

const props = defineProps<{
  /** Bound value: Date object or ISO string or null */
  modelValue?: Date | string | null
  /** Calendar options */
  options?: CalendarOptions
  /** If true, default to today when no value provided */
  autoDefault?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Date | null): void
}>()

// Parse initial date from modelValue
function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const initialDate = computed(() => {
  const parsed = parseDate(props.modelValue)
  if (parsed) return parsed
  if (props.autoDefault) return new Date()
  return null
})

const {
  selectedDate,
  viewMonth,
  viewYear,
  monthName,
  weekdayHeaders,
  weekdayHeadersFull,
  calendarDays,
  prevMonth,
  nextMonth,
  selectDate,
  goToDate,
} = useCalendar(initialDate.value, props.options)

// Sync selectedDate back to modelValue
watch(selectedDate, date => {
  emit('update:modelValue', date)
})

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    const parsed = parseDate(newValue)
    if (parsed && (!selectedDate.value || parsed.getTime() !== selectedDate.value.getTime())) {
      selectDate(parsed)
      goToDate(parsed)
    }
  },
)

function handleDayClick(day: (typeof calendarDays.value)[0]) {
  if (day.isDisabled) return
  selectDate(day.date)
}
</script>

<template>
  <div class="pika-single">
    <div class="pika-lendar">
      <!-- Header with navigation -->
      <div class="pika-title">
        <div class="pika-label">
          {{ monthName }}
          <select
            class="pika-select pika-select-month"
            :value="viewMonth"
            @change="
              e => {
                const target = e.target as HTMLSelectElement
                const newMonth = parseInt(target.value, 10)
                const d = new Date(viewYear, newMonth, 1)
                goToDate(d)
              }
            "
          >
            <option
              v-for="(m, i) in [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ]"
              :key="i"
              :value="i"
            >
              {{ m }}
            </option>
          </select>
        </div>
        <div class="pika-label">
          {{ viewYear }}
          <select
            class="pika-select pika-select-year"
            :value="viewYear"
            @change="
              e => {
                const target = e.target as HTMLSelectElement
                const newYear = parseInt(target.value, 10)
                const d = new Date(newYear, viewMonth, 1)
                goToDate(d)
              }
            "
          >
            <option v-for="y in Array.from({ length: 21 }, (_, i) => viewYear - 10 + i)" :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </div>
        <button type="button" class="pika-prev" @click="prevMonth">Previous Month</button>
        <button type="button" class="pika-next" @click="nextMonth">Next Month</button>
      </div>

      <!-- Calendar grid -->
      <table class="pika-table" role="grid">
        <thead>
          <tr>
            <th v-for="(day, i) in weekdayHeaders" :key="i" scope="col">
              <abbr :title="weekdayHeadersFull[i]">{{ day }}</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in 6" :key="week" class="pika-row">
            <td
              v-for="dayIndex in 7"
              :key="dayIndex"
              :class="{
                'is-today': calendarDays[(week - 1) * 7 + dayIndex - 1]?.isToday,
                'is-selected': calendarDays[(week - 1) * 7 + dayIndex - 1]?.isSelected,
                'is-disabled': calendarDays[(week - 1) * 7 + dayIndex - 1]?.isDisabled,
                'is-outside-current-month': calendarDays[(week - 1) * 7 + dayIndex - 1]?.isOutsideMonth,
              }"
              :aria-selected="calendarDays[(week - 1) * 7 + dayIndex - 1]?.isSelected"
              :data-day="calendarDays[(week - 1) * 7 + dayIndex - 1]?.day"
            >
              <button
                type="button"
                class="pika-button pika-day"
                :disabled="calendarDays[(week - 1) * 7 + dayIndex - 1]?.isDisabled"
                :data-pika-year="calendarDays[(week - 1) * 7 + dayIndex - 1]?.year"
                :data-pika-month="calendarDays[(week - 1) * 7 + dayIndex - 1]?.month"
                :data-pika-day="calendarDays[(week - 1) * 7 + dayIndex - 1]?.day"
                @click="handleDayClick(calendarDays[(week - 1) * 7 + dayIndex - 1]!)"
              >
                {{ calendarDays[(week - 1) * 7 + dayIndex - 1]?.day }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
