<template>
  <figure class="diff" tabindex="0">
    <div class="diff-item-1" role="img" tabindex="0">
      <slot name="one" />
    </div>
    <div class="diff-item-2" role="img">
      <slot name="two" />
    </div>
    <div class="diff-resizer" />
  </figure>
</template>
