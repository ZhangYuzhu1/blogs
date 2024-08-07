import type { QScrollArea } from 'quasar'
import { getConfigApi } from 'shared/api/config'
import type { IConfigDto } from 'shared/types/dto/config.interface'
import type { SysConfig } from 'shared/types/enum/config.enum'

const scrollEl = ref<QScrollArea>()
const page = ref<IConfigDto[SysConfig.HOME] | null>(null)

export function useClientApp() {
  async function getPageConfig(path: string) {
    page.value = null
    const data = await getConfigApi(path)
    if (data)
      page.value = data
  }

  return {
    scrollEl,
    page,
    getPageConfig,
  }
}
