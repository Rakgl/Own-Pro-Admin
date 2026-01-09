import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: '',
    items: [
      {
        title: 'nav.dashboard',
        icon: 'i-lucide-layout-dashboard',
        link: '/dashboard',
      },
    ],
  },
  {
    heading: 'nav.core_administration',
    items: [
      {
        title: 'nav.authentication',
        icon: 'i-lucide-lock-keyhole-open',
        children: [
          {
            title: 'nav.role_permission',
            icon: 'i-lucide-circle',
            link: '/roles',
          },
          {
            title: 'nav.system_users',
            icon: 'i-lucide-circle',
            link: '/users',
          },
        ],
      },
      {
        title: 'sidebar.menu.settings',
        icon: 'i-lucide-settings',
        children: [
          {
            title: 'sidebar.menu.profile',
            icon: 'i-lucide-circle',
            link: '/settings/profile',
          },
          {
            title: 'sidebar.menu.account',
            icon: 'i-lucide-circle',
            link: '/settings/account',
          },
          {
            title: 'sidebar.menu.appearance',
            icon: 'i-lucide-circle',
            link: '/settings/appearance',
          },
        ],
      },
    ],
  },
]

export const navMenuBottom: NavMenuItems = [
  {
    title: 'nav.help_support',
    icon: 'i-lucide-circle-help',
    link: '/support',
  },
  {
    title: 'nav.feedback',
    icon: 'i-lucide-send',
    link: '/feedback',
  },
]