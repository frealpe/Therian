import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilSatelite, cilCart } from '@coreui/icons'

const _nav = [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: 'CNavTitle',
    name: 'Therian Ecosystem',
  },
  {
    component: 'CNavItem',
    name: 'Live AR View',
    to: '/dashboard',
    icon: <CIcon icon={cilSatelite} customClassName="nav-icon" />,
  },
  {
    component: 'CNavItem',
    name: 'Marketplace',
    to: '/dashboard',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
]

export default _nav
