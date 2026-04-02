import React, { useState } from 'react'
import {
    CContainer, CCard, CCardBody, CCardHeader, CRow, CCol,
    CForm, CFormLabel, CFormInput, CButton, CNav, CNavItem, CNavLink,
    CTabContent, CTabPane
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilSettings, cilTerminal, cilSave, cilTrash, cilCloudUpload, cilCloudDownload, cilActionUndo } from '@coreui/icons'
import useSettings from '../hook/useSettings'

const Settings = () => {
    const [activeTab, setActiveTab] = useState(0)
    const {
        device, setDevice, user, setUser,
        handleSubmit, clearUser, downloadSettings, uploadSettings,
        uploadFirmware, loading, progress, percent, showAlertConfirm
    } = useSettings()

    const updateDevice = (f, v) => setDevice(p => ({ ...p, [f]: v }))
    const updateUser = (f, v) => setUser(p => ({ ...p, [f]: v }))

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración General</h4>
            <CRow className="g-3">
                {/* Tabs Block */}
                <CCol md={7}>
                    <CCard className="border-neon h-100">
                        <CCardHeader>DEVICE_CONFIGURATION</CCardHeader>
                        <CCardBody>
                            <CNav variant="tabs" role="tablist" style={{ borderBottom: '1px solid rgba(0, 242, 255, 0.1)' }}>
                                <CNavItem>
                                    <CNavLink
                                        active={activeTab === 0}
                                        onClick={() => setActiveTab(0)}
                                        style={{
                                            cursor: 'pointer',
                                            color: activeTab === 0 ? 'var(--neon-primary)' : '#fff',
                                            background: activeTab === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === 0 ? '2px solid var(--neon-primary)' : 'none'
                                        }}
                                        className="d-flex align-items-center uppercase-mini"
                                    >
                                        <CIcon icon={cilUser} className="me-2" /> SET_USER
                                    </CNavLink>
                                </CNavItem>
                                <CNavItem>
                                    <CNavLink
                                        active={activeTab === 1}
                                        onClick={() => setActiveTab(1)}
                                        style={{
                                            cursor: 'pointer',
                                            color: activeTab === 1 ? 'var(--neon-primary)' : '#fff',
                                            background: activeTab === 1 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === 1 ? '2px solid var(--neon-primary)' : 'none'
                                        }}
                                        className="d-flex align-items-center uppercase-mini"
                                    >
                                        <CIcon icon={cilSettings} className="me-2" /> CORE_SYS
                                    </CNavLink>
                                </CNavItem>
                                <CNavItem>
                                    <CNavLink
                                        active={activeTab === 2}
                                        onClick={() => setActiveTab(2)}
                                        style={{
                                            cursor: 'pointer',
                                            color: activeTab === 2 ? 'var(--neon-primary)' : '#fff',
                                            background: activeTab === 2 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === 2 ? '2px solid var(--neon-primary)' : 'none'
                                        }}
                                        className="d-flex align-items-center uppercase-mini"
                                    >
                                        <CIcon icon={cilTerminal} className="me-2" /> FW_UPDATE
                                    </CNavLink>
                                </CNavItem>
                            </CNav>

                            <CTabContent className="mt-4">
                                {/* Tab: Usuario */}
                                <CTabPane visible={activeTab === 0}>
                                    <h6 className="text-info uppercase-mini mb-3">CREDENTIAL_OVERRIDE</h6>
                                    <CForm onSubmit={e => { e.preventDefault(); handleSubmit('user') }}>
                                        {[
                                            { id: 'device_old_user', label: 'PREVIOUS_USER', type: 'text' },
                                            { id: 'device_old_password', label: 'PREVIOUS_KEY', type: 'password' },
                                            { id: 'device_new_user', label: 'NEW_USER_ID', type: 'text' },
                                            { id: 'device_new_password', label: 'NEW_ACCESS_KEY', type: 'password' },
                                            { id: 'device_c_new_password', label: 'CONFIRM_KEY', type: 'password' },
                                        ].map(({ id, label, type }) => (
                                            <div className="mb-3" key={id}>
                                                <CFormLabel className="small opacity-75">{label}</CFormLabel>
                                                <CFormInput className="monospace" type={type} placeholder={label} value={user[id] || ''} onChange={e => updateUser(id, e.target.value)} />
                                            </div>
                                        ))}
                                        <div className="d-grid gap-2 d-md-flex mt-4">
                                            <CButton type="submit" color="primary" className="px-4"><CIcon icon={cilSave} className="me-2" /> SAVE</CButton>
                                            <CButton type="button" color="secondary" variant="outline" onClick={clearUser} className="px-4"><CIcon icon={cilTrash} className="me-2" /> CLEAR</CButton>
                                        </div>
                                    </CForm>
                                </CTabPane>

                                {/* Tab: Dispositivo */}
                                <CTabPane visible={activeTab === 1}>
                                    <h6 className="text-info uppercase-mini mb-3">SYSTEM_IDENTITY</h6>
                                    <CForm onSubmit={e => { e.preventDefault(); handleSubmit('device') }}>
                                        <div className="mb-3">
                                            <CFormLabel className="small opacity-75">HARDWARE_SERIAL</CFormLabel>
                                            <CFormInput className="monospace bg-dark" readOnly value={device.device_serial || ''} />
                                        </div>
                                        <div className="mb-4">
                                            <CFormLabel className="small opacity-75">NETWORK_HOSTNAME (mDNS)</CFormLabel>
                                            <CFormInput className="monospace" placeholder="adminiot32" value={device.device_id || ''} onChange={e => updateDevice('device_id', e.target.value)} />
                                        </div>
                                        <CButton type="submit" color="primary" className="px-5"><CIcon icon={cilSave} className="me-2" /> UPDATE_IDENTITY</CButton>
                                        <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderLeft: '3px solid var(--neon-primary)' }}>
                                            <p className="mb-0 small text-white-50">
                                                ACCESS_URL: <code className="text-info">http://{device.device_id || 'device'}.local</code>
                                            </p>
                                        </div>
                                    </CForm>
                                </CTabPane>

                                {/* Tab: Firmware */}
                                <CTabPane visible={activeTab === 2}>
                                    <h6 className="text-info uppercase-mini mb-3">KERNEL_FLASH_PROCEDURE</h6>
                                    <p className="text-white-50 small mb-4">Warning: Do not power off during memory writing operation.</p>
                                    <div className="input-group mb-3 border-neon p-1 rounded">
                                        <input type="file" accept="application/octet-stream" className="form-control bg-transparent border-0 text-white" id="inputFileFirmware" />
                                        <CButton color="primary" onClick={uploadFirmware} className="px-4">FLASH_ROM</CButton>
                                    </div>
                                    {loading && (
                                        <div className="mt-4">
                                            <h6 className="uppercase-mini">WRITING_TO_FLASH... {percent}</h6>
                                            <div className="progress mt-2" style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                                <div
                                                    className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                                                    style={{ width: percent, boxShadow: '0 0 10px var(--neon-primary)' }}
                                                >
                                                </div>
                                            </div>
                                            <p className="small text-info mt-1 monospace">{progress.msg}</p>
                                        </div>
                                    )}
                                </CTabPane>
                            </CTabContent>
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Settings file Block */}
                <CCol md={5}>
                    <CCard className="border-neon h-100">
                        <CCardHeader>CONFIG_IO_MANAGER</CCardHeader>
                        <CCardBody>
                            <div className="mb-4">
                                <h6 className="uppercase-mini text-info mb-2">EXPORT_SCHEMA</h6>
                                <p className="text-white-50 small">Save current state to <code className="text-white">settings.json</code></p>
                                <CButton color="primary" variant="outline" onClick={downloadSettings} className="w-100 d-flex align-items-center justify-content-center">
                                    <CIcon icon={cilCloudDownload} className="me-2" /> DOWNLOAD_CONFIG
                                </CButton>
                            </div>

                            <hr className="border-secondary opacity-25 my-4" />

                            <div className="mb-4">
                                <h6 className="uppercase-mini text-danger mb-2">SYSTEM_RESET</h6>
                                <p className="text-white-50 small">Restore factory defaults and clear all NVS memory.</p>
                                <CButton color="danger" variant="outline" className="w-100 d-flex align-items-center justify-content-center"
                                    onClick={() => showAlertConfirm('Restablecer', '¿Está seguro de volver a las configuraciones de fábrica?', 'question', 'restore')}>
                                    <CIcon icon={cilActionUndo} className="me-2" /> FACTORY_RESET
                                </CButton>
                            </div>

                            <hr className="border-secondary opacity-25 my-4" />

                            <div>
                                <h6 className="uppercase-mini text-info mb-2">IMPORT_SCHEMA</h6>
                                <p className="text-white-50 small">Upload an existing configuration manifest.</p>
                                <div className="input-group border-neon p-1 rounded">
                                    <input type="file" accept="application/json" className="form-control bg-transparent border-0 text-white" id="inputFileAdd" />
                                    <CButton color="primary" onClick={uploadSettings}>INJECT</CButton>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </CContainer>
    )
}

export default Settings
