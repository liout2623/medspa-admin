import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/auth/Login.vue'
import UserList from '../views/users/UserList.vue'
import CustomerList from '../views/customers/CustomerList.vue'
import CustomerDetail from '../views/customers/CustomerDetail.vue'
import AppLayout from '../components/layout/AppLayout.vue'
import AccountSettings from '../views/settings/AccountSettings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { title: '登录' } },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', redirect: { name: 'customers' } },
        { path: 'users', name: 'users', component: UserList, meta: { title: '用户管理' } },
        { path: 'customers', name: 'customers', component: CustomerList, meta: { title: '客户管理' } },
        { path: 'customers/:id', name: 'customer-detail', component: CustomerDetail, meta: { title: '客户详情' } },
        { path: 'profile', name: 'profile', component: AccountSettings, meta: { title: '个人设置' } }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.init()
  if (to.path !== '/login' && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/customers'
})

export default router