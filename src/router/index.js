import { createRouter, createWebHashHistory } from 'vue-router'
import PasscodePage from '../views/PasscodePage.vue'
import DashboardPage from '../views/DashboardPage.vue'

const routes = [
  { path: '/', name: 'Passcode', component: PasscodePage },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    beforeEnter: (to, from, next) => {
      if (sessionStorage.getItem('qe_authenticated') === 'true') {
        next()
      } else {
        next('/')
      }
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
