import React from 'react'

const Dashboard = React.lazy(() => import('./views/therian/Dashboard'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Therian Dashboard', element: Dashboard },
]

export default routes
