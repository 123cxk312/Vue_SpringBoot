import { defineStore } from "pinia";
import { computed,ref } from "vue";
import { authApi,type UserProfile } from "@/api/auth";
import { getToken,setToken,removeToken } from "@/utils/token";

//const TOKEN_KEY='token'


export const useAuthStore=defineStore('auth',()=>{
  const token=ref<string|null>(getToken())
  const user=ref<UserProfile|null>(null)

  const isLoggedIn=computed(()=>Boolean(token.value))
  const roleCode=computed(()=>user.value?.roleCode??null)

  function setAuth(newToken:string,newUser:UserProfile){
    token.value=newToken
    user.value=newUser
    setToken(newToken)
  }

  function clearAuth(){
    token.value=null
    user.value=null
    removeToken()
  }

  async function fetchProfile(){
    const response=await authApi.me()
    const result=response.data

    if(result.code!==200){
      throw new Error(result.message)
    }

    user.value=result.data
    return user.value
  }

  async function logout(){
    try{
      await authApi.logout()
    }finally{
      clearAuth()
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    roleCode,
    setAuth,
    clearAuth,
    fetchProfile,
    logout,
  }
})
