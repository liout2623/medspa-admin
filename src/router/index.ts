import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/auth/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import UserList from '../views/users/UserList.vue'
import CustomerList from '../views/customers/CustomerList.vue'
import CustomerDetail from '../views/customers/CustomerDetail.vue'
import ServiceList from '../views/services/ServiceList.vue'
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
        { path: '', redirect: { name: 'dashboard' } },
        { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '工作台' } },
        { path: 'users', name: 'users', component: UserList, meta: { title: '用户管理', requiresAdmin: true } },
        { path: 'customers', name: 'customers', component: CustomerList, meta: { title: '客户管理' } },
        { path: 'services', name: 'services', component: ServiceList, meta: { title: '服务项目管理' } },
        { path: 'customers/:id', name: 'customerDetail', component: CustomerDetail, meta: { title: '客户详情' } },
        { path: 'profile', name: 'profile', component: AccountSettings, meta: { title: '个人设置' } }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.init()
  if (to.path !== '/login' && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/dashboard'
  if (to.meta.requiresAdmin && auth.user?.role !== 'ADMIN') return '/customers'
})

export default router