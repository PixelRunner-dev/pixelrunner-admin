<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

interface Props {
  data?: object | Array<unknown>;
}

const props = defineProps<Props>();

const randKey = Math.ceil(Math.random() * 10_000);
const pre = ref<HTMLPreElement | null>(null);

const dataItems = computed(() => {
  const dataType = Object.prototype.toString
    .call(props.data)
    .substring('[object '.length)
    .replace(']', '')
    .toLowerCase();

  if (dataType === 'object') return props.data;
  if (dataType === 'array') return Object.assign({}, props.data);
  return {};
});

async function addLineNumbersToPre() {
  await nextTick();

  const preElement = pre.value;
  if (!preElement) return;

  preElement.querySelector('.line')?.remove();

  const text = preElement.textContent ?? '';
  const lines = text.replace(/\n$/, '').split(/\r\n|\r|\n/);

  preElement.innerHTML = '';

  for (let lineNumber = 0; lineNumber <= lines.length; lineNumber++) {
    const span = document.createElement('span');
    span.classList.add('line');
    span.innerText = lines[lineNumber] ?? '';
    preElement.appendChild(span);
    preElement.appendChild(document.createTextNode('\n'));
  }
}

function handlePreClick(event: MouseEvent) {
  if (event.detail !== 3) return;

  const preElement = pre.value;
  if (!preElement) return;

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(preElement);
  selection.removeAllRanges();
  selection.addRange(range);
}

onMounted(() => {
  void addLineNumbersToPre();
});

watch(
  () => props.data,
  () => {
    void addLineNumbersToPre();
  },
  { deep: true }
);
</script>

<template>
  <section
    class="debug-panel my-4 p-4 rounded-box border-5 border-red-500 bg-red-100 text-neutral-900"
  >
    <h2 class="mb-2 text-lg font-bold">Debug</h2>
    <template v-if="props.data">
      <dl class="divide-y divide-base-200 text-xs">
        <div v-for="(d, k) of dataItems" :key="`debug-${k}-${randKey}`" class="flex py-2">
          <dt class="w-1/4 font-bold">
            <pre>{{ k }}</pre>
          </dt>
          <dd class="flex-1">
            <pre>{{ d }}</pre>
          </dd>
        </div>
      </dl>
      <details class="mt-2">
        <summary class="btn btn-primary btn-xs mb-2">Toggle raw data</summary>
        <pre ref="pre" class="hasLineNumbers" @click="handlePreClick">{{ props.data }}</pre>
      </details>
      <hr v-if="$slots.default" />
    </template>
    <slot />
  </section>
</template>

<style>
pre {
  counter-reset: linecounter;
  padding: 0;
  max-width: 52ch;
  max-height: 10lh;
  overflow: auto;
  scrollbar-width: thin;
}

pre.hasLineNumbers {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent calc(50% - 1px),
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  background-repeat: repeat-y;
  background-attachment: local;
  background-size: 100% 2lh;
}

pre .line {
  counter-increment: linecounter;
}

pre .line::before {
  content: counter(linecounter);
  display: inline-block;
  border-right: 1px dotted var(--color-primary);
  padding-right: 3px;
  margin-right: 5px;
  text-align: right;
  width: 3ch;
}
</style>
