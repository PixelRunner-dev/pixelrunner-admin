<script setup lang="ts">
import { ref } from 'vue';

import {
  Checkbox as DCheckbox,
  Fieldset as DFieldset,
  Flex as DFlex,
  FormControl as DFormControl,
  Input as DInput,
  Label as DLabel,
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';

const daysOfWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

const schedule = ref(false);
const scheduleStart = ref('8:00');
const scheduleEnd = ref('17:00');
const scheduleDays = ref([false, true, true, true, true, true, false]);
</script>

<template>
<DFieldset :legend="$t('schedule.legend')" class="component--field-schedule my-4 gap-4">
  <DFormControl class="gap-1">
    <DLabel for="schedule">
      <DCheckbox id="schedule" name="schedule" v-model="schedule" />
      <DText size="sm">{{ $t('schedule.label') }}</DText>
    </DLabel>
  </DFormControl>

  <template v-if="schedule">
    <DFormControl class="gap-1 min-w-0 max-w-full overflow-x-auto overflow-y-hidden min-w-0 scrollbar-thin" tabindex="-1">
      <div class="grid grid-cols-7 gap-2 p-1 w-max">
        <DLabel v-for="d in daysOfWeek" :key="d" :for="`schedule-${d}`" :aria-label="`Toggle ${d}`" tabindex="0"
          class="rounded-field border border-base-300 bg-base-100 hover:border-neutral focus-within:outline-2 focus-within:outline-2 focus-within:outline-offset-2 focus:border-neutral"
          @keyup.enter.space="scheduleDays[daysOfWeek.indexOf(d)] = !scheduleDays[daysOfWeek.indexOf(d)]">
          <DFlex itemsCenter class="flex-col p-2 gap-2 w-full">
            <DText>{{ d.charAt(0).toUpperCase() + d.slice(1) }}</DText>
            <DCheckbox :id="`schedule-${d}`" v-model="scheduleDays[daysOfWeek.indexOf(d)]" sm :name="d" tabindex="-1" />
          </DFlex>
        </DLabel>
      </div>
    </DFormControl>

    <DFormControl class="gap-1">
      <DLabel input>
        <DText label size="sm">{{ $t('schedule.start.label') }}</DText>
        <DInput type="time" name="schedule-start" v-model="scheduleStart" />
      </DLabel>
    </DFormControl>

    <DFormControl class="gap-1">
      <DLabel input>
        <DText label size="sm">{{ $t('schedule.end.label') }}</DText>
        <DInput type="time" name="schedule-end" v-model="scheduleEnd" />
      </DLabel>
    </DFormControl>
  </template>
</DFieldset>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}
</style>
