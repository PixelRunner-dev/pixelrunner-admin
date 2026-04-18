<script setup lang="ts">
interface Props {
  title: string;
  payoff?: string;
}

const { title, payoff }: Props = defineProps<Props>();
</script>

<template>
  <section class="component--store-selection">
    <hgroup class="mt-8 my-1">
      <h2 class="text-3xl">{{ title }}</h2>
      <p v-if="payoff" class="text-lg">{{ payoff }}</p>
    </hgroup>

    <slot />
  </section>
</template>
