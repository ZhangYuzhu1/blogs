<script setup lang="ts">
interface Props {
  arrow?: boolean
  height?: string
}

withDefaults(defineProps<Props>(), {
  arrow: true,
  height: '600px',
})

const route = useRoute()
const { scrollEl, page, getPageConfig } = useClientApp()
const el = ref<HTMLElement>()

/** 滚动 */
function arrowDown() {
  if (el.value) {
    scrollEl.value?.setScrollPosition(
      'vertical',
      el.value?.clientHeight - 40,
      300,
    )
  }
}

onMounted(async () => {
  await getPageConfig(route.path.split('/')[1])
})
</script>

<template>
  <div relative>
    <div
      ref="el"
      relative w-full overflow-hidden
      :style="{ height }"
    >
      <img full :src="page?.url">
    </div>
    <template v-if="page">
      <Title :page="page" />
    </template>
    <div
      v-if="arrow"
      class="arrow-down" bg="grey-1" w10 h10 i-ph:caret-double-down-bold
      @click="arrowDown"
    />
  </div>
</template>

<style scoped lang="scss">
.arrow-down {
  position: absolute;
  bottom: 80px;
  left: 49%;
  -webkit-animation: arrow-shake 1.5s ease-out infinite;
  animation: arrow-shake 1.5s ease-out infinite;
  cursor: pointer;
}

@keyframes arrow-shake {
  0% {
    opacity: 1;
    transform: translateY(0);
  }

  30% {
    opacity: 0.5;
    transform: translateY(25px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
~/hooks/app
