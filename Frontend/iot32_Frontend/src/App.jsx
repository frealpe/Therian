import React, { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { CSpinner } from '@coreui/react'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'


import DefaultLayout from './layout/DefaultLayout'

const Login = React.lazy(() => import('./views/Login'))

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<div className="text-center py-5"><CSpinner color="primary" /></div>}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" name="home" element={<DefaultLayout />} />
      </Routes>
    </Suspense>
    <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover />
  </BrowserRouter>
)

export default App
