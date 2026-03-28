import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import routes from '../routes'

const DefaultLayout = () => {
    return (
        <div className="wrapper d-flex flex-column min-vh-100 bg-dark text-white">
            <div className="body flex-grow-1 py-4">
                <CContainer fluid className="px-4">
                    <Suspense fallback={<CSpinner color="info" />}>
                        <Routes>
                            {routes.map((route, idx) => {
                                return (
                                    route.element && (
                                        <Route
                                            key={idx}
                                            path={route.path}
                                            exact={route.exact}
                                            name={route.name}
                                            element={<route.element />}
                                        />
                                    )
                                )
                            })}
                            <Route path="/" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </CContainer>
            </div>
        </div>
    )
}

export default DefaultLayout
