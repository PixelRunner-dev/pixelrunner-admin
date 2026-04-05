<script setup lang="ts">
interface Props {
  title: string;
  payoff?: string;
}

const { title, payoff }: Props = defineProps<Props>();
</script>

<template>
  <section class="component--store-selection">
    <hgroup>
      <h2>{{ title }}</h2>
      <p v-if="payoff">{{ payoff }}</p>
    </hgroup>

    <slot />
  </section>
</template>
