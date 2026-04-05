<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const { durationInSeconds = 0, untilDate } = defineProps<{
  durationInSeconds?: number
  untilDate?: Date
}>()
const emit = defineEmits(['done'])

function getTargetDate() {
  return untilDate || new Date(Date.now() + durationInSeconds * 1000)
}

const targetDate = ref(getTargetDate())

watch(
  () => [durationInSeconds, untilDate],
  () => {
    targetDate.value = getTargetDate()
  },
  { immediate: true },
)

const timeLeft = ref(0)
const calcTimeLeft = () => Math.max(0, targetDate.value.getTime() - Date.now())

useIntervalFn(() => {
  timeLeft.value = calcTimeLeft()
}, 1000)

watch(timeLeft, val => {
  if (val === 0) {
    emit('done')
  }
})

const totalSeconds = computed(() => Math.round(timeLeft.value / 1000))
const totalMinutes = computed(() => Math.floor(totalSeconds.value / 60))
const totalHours = computed(() => Math.floor(totalMinutes.value / 60))
const totalDays = computed(() => Math.floor(totalHours.value / 24))
const totalWeeks = computed(() => Math.floor(totalDays.value / 7))
const totalMonths = computed(() => {
  const now = new Date()
  return (targetDate.value.getFullYear() - now.getFullYear()) * 12 + (targetDate.value.getMonth() - now.getMonth())
})
const split = computed(() => {
  const days = totalDays.value
  const hours = totalHours.value - days * 24
  const minutes = totalMinutes.value - totalHours.value * 60
  const seconds = totalSeconds.value - totalMinutes.value * 60
  return { days, hours, minutes, seconds }
})
</script>

<template>
  <slot
    v-bind="{
      totalSeconds,
      totalMinutes,
      totalHours,
      totalDays,
      totalWeeks,
      totalMonths,
      targetDate,
      split,
    }"
  />
</template>
