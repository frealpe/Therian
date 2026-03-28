import React, { Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import './index.css'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

const App = () => {
  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center bg-dark vh-100 d-flex align-items-center justify-content-center">
            <CSpinner color="info" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
