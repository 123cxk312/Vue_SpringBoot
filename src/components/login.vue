<template>
  <h1 id="login_name">学生成绩管理系统</h1>
  <div id="input_box">
    <label>
      用户名:<input type="text" v-model.trim="username" autocomplete="username">
    </label>
    <label>
      密码: <input type="password" v-model="password" autocomplete="current-password">
    </label>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <button
      type="button"
      :disabled="loading"
      @click="handleLogin"
    >{{ loading?'登录中...':'登录'}}</button>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { authApi } from '@/api/auth';
  import { useAuthStore } from '@/stores/authStore';
  import { useRouter } from 'vue-router';
  import axios from "axios";
  import type { ApiResult } from "@/types/api";
  defineOptions({name:"login"})

  const username=ref('')
  const password=ref('')
  const errorMessage=ref('')
  const loading=ref(false)
  const router=useRouter()

  const authStore=useAuthStore()

  async function handleLogin(){
    errorMessage.value=''

    if(!username.value){
      errorMessage.value='用户名不能为空'
      return
    }
    if(!password.value){
      errorMessage.value='密码不能为空'
      return
    }

    loading.value=true

    try{
      const response=await authApi.login({
        username:username.value,
        password:password.value,
      })

      const result=response.data

      if(result.code!==200){
        errorMessage.value=result.message
        return
      }

      const loginData=result.data

      authStore.setAuth(loginData.token,loginData.user)
      console.log('登录成功',authStore.user?.username)
      await router.replace('/home')

    }catch (error) {
      console.error(error);

      if (axios.isAxiosError<ApiResult<null>>(error)) {
        if (error.response) {
          errorMessage.value =
            error.response.data?.message ?? "登录失败";
        } else if (error.request) {
          errorMessage.value =
            "无法连接后端服务，请确认 Spring Boot 已启动";
        } else {
          errorMessage.value = "登录请求发送失败";
        }
      } else {
        errorMessage.value = "登录失败，请稍后重试";
      }
    }finally{
      loading.value = false
    }

    }
</script>

<style>
  html,
  body {
    min-height: 100%;
    margin: 0;
  }

  body {
    background-color: aliceblue;
  }

  /* Vue 挂载节点作为登录页容器 */
  #app {
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 32px;
  }

  #login_name {
    margin: 0;
    font-size: 30px;
    font-weight: bold;
    color: black;
    text-align: center;
  }

  #input_box {
    width: min(420px, calc(100vw - 40px));
    box-sizing: border-box;
    padding: 32px;

    display: flex;
    flex-direction: column;
    gap: 22px;

    background-color: rgb(252, 250, 250);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgb(15 23 42 / 8%);
  }

  #input_box label {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: center;
    gap: 14px;

    font-size: 18px;
    color: #333;
  }

  #input_box input {
    width: 100%;
    height: 46px;
    box-sizing: border-box;
    padding: 0 14px;

    font-size: 16px;
    font-family: inherit;
    color: #1f2937;

    background-color: white;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: none;
  }

  #input_box input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
  }

  .error-message {
  margin: 0;
  color: #dc2626;
  font-size: 14px;
}

#input_box button {
  height: 46px;
  border: none;
  border-radius: 6px;
  background-color: #2563eb;
  color: white;
  font-size: 17px;
  cursor: pointer;
}

#input_box button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>
