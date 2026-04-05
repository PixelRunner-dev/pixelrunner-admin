<script setup lang="ts">
import type { CalendarOptions } from '../composables/use-calendar'
import { computed, ref, useId, watch } from 'vue'
import { useCalendar } from '../composables/use-calendar'

const props = defineProps<{
  /** Bound value: Date object or ISO string or null */
  modelValue?: Date | string | number | null
  /** Calendar options */
  options?: CalendarOptions
  /** If true, default to today when no value provided */
  autoDefault?: boolean
  placeholder?: string
  disabled?: boolean
  validator?: boolean
  join?: boolean
  color?: string
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  info?: boolean
  success?: boolean
  warning?: boolean
  error?: boolean
  ghost?: boolean
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Date | null): void
  (e: 'update:inputValue', v: string | null): void
}>()

const uniqueId = useId()
const popoverId = `calendar-popover-${uniqueId}`
const anchorName = `--calendar-anchor-${uniqueId}`
const inputRef = ref<HTMLInputElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

// Parse date from various input types
function parseDate(value: Date | string | number | null | undefined): Date | null {
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
  formatDate,
} = useCalendar(initialDate.value, props.options)

// Input display value
const inputValue = computed(() => formatDate('D MMM YYYY'))

// Sync selectedDate back to modelValue
watch(selectedDate, date => {
  emit('update:modelValue', date)
  emit('update:inputValue', formatDate('D MMM YYYY'))
})

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    const parsed = parseDate(newValue)
    if (parsed && (!selectedDate.value || parsed.getTime() !== selectedDate.value.getTime())) {
      selectDate(parsed)
      goToDate(parsed)
    } else if (!newValue && selectedDate.value) {
      selectedDate.value = null
    }
  },
)

function handleDayClick(day: (typeof calendarDays.value)[0]) {
  if (day.isDisabled) return
  selectDate(day.date)
  popoverRef.value?.hidePopover()
}

function handleClick() {
  // Sync view to selected date when opening
  if (selectedDate.value) {
    goToDate(selectedDate.value)
  }
  popoverRef.value?.togglePopover()
}
</script>

<template>
  <div class="relative inline-block">
    <input
      ref="inputRef"
      type="text"
      readonly
      :value="inputValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      class="input cursor-pointer"
      :class="[
        { validator: props.validator },
        { 'input-primary': props.primary || props.color === 'primary' },
        { 'input-secondary': props.secondary || props.color === 'secondary' },
        { 'input-accent': props.accent || props.color === 'accent' },
        { 'input-info': props.info || props.color === 'info' },
        { 'input-success': props.success || props.color === 'success' },
        { 'input-warning': props.warning || props.color === 'warning' },
        { 'input-error': props.error || props.color === 'error' },
        { 'input-ghost': props.ghost },
        { 'input-xl': props.xl || props.size === 'xl' },
        { 'input-lg': props.lg || props.size === 'lg' },
        { 'input-md': props.md || props.size === 'md' },
        { 'input-sm': props.sm || props.size === 'sm' },
        { 'input-xs': props.xs || props.size === 'xs' },
        { 'join-item': props.join },
      ]"
      :style="{ 'anchor-name': anchorName } as any"
      v-bind="$attrs"
      @click="handleClick"
    />

    <!-- Dropdown calendar using Popover API -->
    <div
      :id="popoverId"
      ref="popoverRef"
      popover="auto"
      class="pika-single calendar-popover"
      :style="{ 'position-anchor': anchorName } as any"
    >
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
              >
                <button
                  type="button"
                  class="pika-button pika-day"
                  :disabled="calendarDays[(week - 1) * 7 + dayIndex - 1]?.isDisabled"
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
  </div>
</template>

<style>
.calendar-popover[popover] {
  position-area: block-end span-inline-end;
  position-try-fallbacks:
    flip-block,
    flip-inline,
    flip-block flip-inline;
  margin: 0;
  margin-top: 0.25rem;
  /* Reset default popover styles */
  border: none;
  inset: auto;
}

.calendar-popover[popover]:popover-open {
  position: fixed;
}

.calendar-popover[popover]:not(:popover-open) {
  display: none;
}
</style>
