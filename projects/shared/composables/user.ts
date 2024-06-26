import { computed, getCurrentInstance, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Router } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { Notify } from 'quasar'

import { getOwnProfileApi, updateOwnPasswordByEmailCodeApi } from '../api/user'
import { rsaEncrypt } from '../utils/common/rsa'
import { getEnvVariable } from '../utils/common/env'
import type { IUser } from '../types/entities/user.interface'
import { loginByEmailCodeApi, loginByPasswordApi, logoutApi, registerApi } from '../api/auth'
import type { PermissionType } from '../types/enum/permission.enum'
import { AUTH_TOKEN_KEY, LEADING_PAGE_KEY, REMEMBER_LOGIN_INFO_KEY } from '../constants/storage'
import type { IRegisterBodyDto } from '../types/http/auth/register.interface'
import type { ILoginByEmailCodeBodyDto } from '../types/http/auth/login-by-email-code.interface'
import type { ILoginByPasswordBodyDto, ILoginSuccessResData } from '../types/http/auth/login-by-password.interface'
import type { IUpdatePasswordByEmailCodeBodyDto } from '../types/http/user/update-pswd-by-email-code.interface'
import { useSysConfig } from './app'

/** 用户token */
export const authToken = useStorage('auth_token', '')
/** 用户管理权限 */
const adminRole = ref<PermissionType[]>()
/** 用户信息 */
const userInfo = ref<IUser>()
/** 用户信息获取时间 */
const getTime = ref<number>()
/** 加载中 */
const loading = ref(false)

export function useUser($router?: Router) {
  const { isAdmin } = useSysConfig()
  const instance = getCurrentInstance()
  if (!$router && instance)
    $router = useRouter()
  /** 登录 */
  async function loginByPassword(body: ILoginByPasswordBodyDto, remember = false) {
    loading.value = true
    try {
      const res = await loginByPasswordApi({ ...body, password: await rsaEncrypt(body.password!) })
      if (res && remember) {
        // 记住密码
        localStorage.setItem(
          REMEMBER_LOGIN_INFO_KEY,
          JSON.stringify({
            userCode: body.account || body.email,
            password: await rsaEncrypt(body.password!),
          }),
        )
      }
      else {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
      processLoginInfo(res)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 邮箱 + 验证码 登录
   * @param body
   */
  async function loginByEmailCode(body: ILoginByEmailCodeBodyDto) {
    loading.value = true
    try {
      const res = await loginByEmailCodeApi(body)
      if (res)
        processLoginInfo(res)
    }
    catch (error) { }
    finally {
      loading.value = false
    }
  }

  /**
   * 邮箱修改密码
   */
  async function updatePasswordByEmailCode(body: IUpdatePasswordByEmailCodeBodyDto) {
    loading.value = true
    try {
      const res = await updateOwnPasswordByEmailCodeApi(body)
      if (res) {
        Notify.create({
          type: 'success',
          message: '修改密码成功',
        })
        $router?.push('/auth/login')
      }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 注册
   * @param body
   */
  async function register(body: IRegisterBodyDto) {
    loading.value = true
    try {
      const res = await registerApi({ ...body, password: await rsaEncrypt(body.password) })
      if (res) {
        Notify.create({
          type: 'success',
          message: '注册成功',
        })
        processLoginInfo(res)
      }
    }
    catch (_) { }
    finally {
      loading.value = false
    }
  }

  /** 获取当前登录用户信息 */
  async function getOwnProfile(relation = 'role.permissions', useCache = true) {
    if (useCache && userInfo.value && getTime.value && Date.now() - getTime.value < 10 * 1000)
      return

    getTime.value = Date.now()

    const res = await getOwnProfileApi({ relation })
    if (res) {
      userInfo.value = res
      adminRole.value = res.role?.permissions?.map(v => v.name)
    }
    return res
  }

  /** 退出登录 */
  async function logout(flag = false) {
    if (!flag) {
      await logoutApi()
      if (isAdmin.value)
        $router?.push('/auth/login')
      else
        $router?.push('/')
    }

    authToken.value = ''
    adminRole.value = []
    userInfo.value = undefined
  }

  /** 处理登录信息 */
  async function processLoginInfo(res: ILoginSuccessResData) {
    const { sign, user } = res
    authToken.value = sign.access_token
    userInfo.value = user
    await getOwnProfile(undefined, false)
    $router?.push(localStorage?.getItem(LEADING_PAGE_KEY) ?? '/')
  }

  /**
   * 用户是否使用手机号
   */
  const isPhone = computed(() => getEnvVariable('VITE_USER_PHONE', false))

  return {
    loading,
    authToken,
    adminRole,
    userInfo,
    isPhone,
    logout,
    register,
    getOwnProfile,
    loginByPassword,
    loginByEmailCode,
    updatePasswordByEmailCode,
  }
}
