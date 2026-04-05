<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from './Skeleton.vue'

const props = defineProps<{
  numberOfMonths?: number
  date?: Date
  firstDay?: number // 0 = Sunday, 1 = Monday, etc. (matches Pikaday's firstDay option)
}>()

// Calculate the number of weeks needed for a given month
function getWeeksInMonth(date: Date, weekStartDay: number = 0): number {
  const year = date.getFullYear()
  const month = date.getMonth()

  // Get first day of month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()

  // Get last day of month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Calculate offset based on what day the week starts on
  // If week starts on Monday (1) and month starts on Sunday (0), offset is 6
  // If week starts on Sunday (0) and month starts on Sunday (0), offset is 0
  const offset = (firstDayOfWeek - weekStartDay + 7) % 7

  // Calculate total cells needed (days in month + offset from first day)
  const totalCells = daysInMonth + offset

  // Return number of weeks (rows) needed
  return Math.ceil(totalCells / 7)
}

// Calculate weeks for each month being displayed
const weeksPerMonth = computed(() => {
  const baseDate = props.date || new Date()
  const weekStartDay = props.firstDay ?? 0
  const weeks: number[] = []

  for (let i = 0; i < (props.numberOfMonths || 1); i++) {
    const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1)
    weeks.push(getWeeksInMonth(monthDate, weekStartDay))
  }

  return weeks
})
</script>

<template>
  <Skeleton col class="bg-base-200 rounded-box">
    <div
      v-for="(weeks, idx) in weeksPerMonth"
      :key="`calendar-${idx}`"
      class="w-[270px] px-3 py-[14px] mx-auto flex flex-col gap-2"
      :class="{
        '-mt-3.5': idx > 0,
      }"
    >
      <Flex justify-between items-center class="mb-3 px-2">
        <span
          class="size-4 rounded-full bg-base-300 inline-block"
          :class="{
            'bg-base-300': idx === 0,
            'bg-transparent': idx !== 0,
          }"
        />
        <span class="h-5 w-20 rounded-full bg-base-300 inline-block" />
        <span
          class="size-4 rounded-full bg-base-300 inline-block"
          :class="{
            'bg-base-300': idx === weeksPerMonth.length - 1,
            'bg-transparent': idx !== weeksPerMonth.length - 1,
          }"
        />
      </Flex>
      <Flex col class="h-full">
        <div class="grid grid-cols-7 gap-[4px] mb-3 flex-shrink-0">
          <span v-for="d in 7" :key="`dow-${d}`" class="size-4 rounded-full bg-base-300 mx-auto block" />
        </div>
        <div class="grid grid-cols-7 gap-y-[8px] gap-x-[4px]">
          <span v-for="i in weeks * 7" :key="`day-${i}`" class="size-7 rounded-full bg-base-300 block mx-auto" />
        </div>
      </Flex>
    </div>
  </Skeleton>
</template>
