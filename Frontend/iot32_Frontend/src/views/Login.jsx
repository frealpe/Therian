import React, { useState } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CContainer,
    CForm,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLockLocked, cilSatelite } from '@coreui/icons'
import logo from '../assets/Logo.jpeg'
import acueducto from '../assets/acueducto.jpeg'
import useApp from '../hook/useApp'

const Login = () => {
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useApp()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        await login(correo, password)
        setLoading(false)
    }

    return (
        <div className="min-vh-100 d-flex flex-row align-items-center" style={{ backgroundColor: '#0a0a0a' }}>
            <CContainer>
                <CRow className="justify-content-center">
                    <CCol md={10} lg={8} xl={6}>
                        <CCard className="bg-glass border-neon overflow-hidden shadow-lg p-2 p-md-4">
                            <CCardBody className="p-4 p-md-5">
                                <div className="text-center mb-5">
                                    <div className="d-inline-block p-2 rounded-circle mb-3 pulse" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid var(--neon-primary)' }}>
                                        <CIcon icon={cilSatelite} style={{ height: 40, width: 40, color: 'var(--neon-primary)' }} />
                                    </div>
                                    <h2 className="text-neon fw-black uppercase-mini fs-3" style={{ letterSpacing: '4px' }}>ACCESS_GRANTED</h2>
                                    <p className="text-white-50 monospace small mt-2">SECURE_IOT_GATEWAY_V1.32</p>
                                </div>

                                <CForm onSubmit={handleLogin}>
                                    <div className="mb-4">
                                        <CFormLabel className="uppercase-mini text-info opacity-75 ms-1">IDENTIFIER (USER/MAC)</CFormLabel>
                                        <CInputGroup className="border-neon rounded">
                                            <CInputGroupText className="bg-transparent border-0 pe-0">
                                                <CIcon icon={cilUser} style={{ color: 'var(--neon-primary)' }} />
                                            </CInputGroupText>
                                            <CFormInput
                                                className="bg-transparent border-0 text-white py-3 monospace"
                                                placeholder="Enter ID..."
                                                value={correo}
                                                onChange={(e) => setCorreo(e.target.value)}
                                                required
                                            />
                                        </CInputGroup>
                                    </div>

                                    <div className="mb-5">
                                        <CFormLabel className="uppercase-mini text-info opacity-75 ms-1">ACCESS_KEY</CFormLabel>
                                        <CInputGroup className="border-neon rounded">
                                            <CInputGroupText className="bg-transparent border-0 pe-0">
                                                <CIcon icon={cilLockLocked} style={{ color: 'var(--neon-primary)' }} />
                                            </CInputGroupText>
                                            <CFormInput
                                                type="password"
                                                className="bg-transparent border-0 text-white py-3 monospace"
                                                placeholder="Enter Key..."
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </CInputGroup>
                                    </div>

                                    <CButton
                                        color="primary"
                                        className="w-100 py-3 fw-bold uppercase-mini shadow-neon"
                                        type="submit"
                                        disabled={loading}
                                        style={{ letterSpacing: '2px' }}
                                    >
                                        {loading ? 'SYNCHRONIZING...' : 'INITIATE_CONNECTION'}
                                    </CButton>
                                </CForm>

                                <div className="text-center mt-5 pt-4 border-top border-secondary border-opacity-25">
                                    <img src={logo} alt="Logo" height={30} className="opacity-50 grayscale hover-brightness" />
                                </div>
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            </CContainer>
        </div>
    )
}

export default Login
