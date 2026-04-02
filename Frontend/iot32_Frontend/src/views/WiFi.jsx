import React from 'react'
import { CContainer, CCard, CCardBody, CCardHeader, CForm, CFormLabel, CFormInput, CFormCheck, CButton, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CCollapse, CBadge, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilSave, cilWifiSignal4, cilSearch, cilCheck, cilLockLocked } from '@coreui/icons'
import useWifi from '../hook/useWifi'
import { useState } from 'react'

const WiFi = () => {
    const {
        wifi, setWifi, count, scan, find, networks,
        wifiIpStatic, apMode, apVisibility, scanning,
        handleSubmit, getWifiScan, seguridad, selectWiFi
    } = useWifi()

    const [showAdvancedIP, setShowAdvancedIP] = useState(false)
    const [showAdvancedAP, setShowAdvancedAP] = useState(false)

    const update = (field, value) => setWifi(prev => ({ ...prev, [field]: value }))

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración de la red inalámbrica</h4>
            <div className="row g-3">
                {/* Connectivity Form */}
                <div className="col-md-4">
                    <CCard className="border-neon h-100">
                        <CCardHeader>CONNECTIVITY_SCHEMA</CCardHeader>
                        <CCardBody>
                            <CForm onSubmit={e => { e.preventDefault(); handleSubmit() }}>
                                <div className="mb-3">
                                    <CFormLabel className="small opacity-75 uppercase-mini">STATION_SSID</CFormLabel>
                                    <CFormInput className="monospace" placeholder="iotmaster" value={wifi.wifi_ssid} onChange={e => update('wifi_ssid', e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <CFormLabel className="small opacity-75 uppercase-mini">ACCESS_KEY</CFormLabel>
                                    <CFormInput className="monospace" type="password" placeholder="*****" value={wifi.wifi_password} onChange={e => update('wifi_password', e.target.value)} />
                                </div>

                                <div className="mb-2">
                                    <button type="button" className="btn btn-link p-0 text-neon d-flex align-items-center uppercase-mini" style={{ fontSize: '0.7rem' }} onClick={() => setShowAdvancedIP(v => !v)}>
                                        <CIcon icon={cilSettings} className="me-1" /> IP_OVERRIDE_OPTIONS
                                    </button>
                                    <CCollapse visible={showAdvancedIP}>
                                        <div className="mt-2 ps-2 border-start border-secondary py-2">
                                            <div className="mb-2 d-flex justify-content-between align-items-center">
                                                <CFormLabel className="small mb-0">DHCP_PROTOCOL</CFormLabel>
                                                <CFormCheck type="switch" label={wifiIpStatic} checked={wifi.wifi_ip_static} onChange={e => update('wifi_ip_static', e.target.checked)} />
                                            </div>
                                            {['wifi_ipv4', 'wifi_subnet', 'wifi_gateway', 'wifi_dns_primary', 'wifi_dns_secondary'].map(field => (
                                                <div className="mb-2" key={field}>
                                                    <CFormLabel className="small opacity-50 uppercase-mini" style={{ fontSize: '0.6rem' }}>{field.replace(/wifi_/g, '').toUpperCase()}</CFormLabel>
                                                    <CFormInput className="monospace py-1" style={{ fontSize: '0.8rem' }} placeholder={field} value={wifi[field]} onChange={e => update(field, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>
                                    </CCollapse>
                                </div>

                                <hr className="border-secondary opacity-25 my-4" />

                                <div className="mb-2 d-flex justify-content-between align-items-center">
                                    <CFormLabel className="uppercase-mini mb-0">AP_BROADCAST</CFormLabel>
                                    <CFormCheck type="switch" label={apMode} checked={wifi.ap_mode} onChange={e => update('ap_mode', e.target.checked)} />
                                </div>
                                <div className="mb-2 mt-3">
                                    <CFormLabel className="small opacity-75 uppercase-mini">AP_SSID_IDENTIFIER</CFormLabel>
                                    <CFormInput className="monospace" placeholder="ESP32_NODE" value={wifi.ap_ssid} onChange={e => update('ap_ssid', e.target.value)} />
                                </div>
                                <div className="mb-2">
                                    <CFormLabel className="small opacity-75 uppercase-mini">AP_SECRET_KEY</CFormLabel>
                                    <CFormInput className="monospace" type="password" placeholder="*****" value={wifi.ap_password} onChange={e => update('ap_password', e.target.value)} />
                                </div>

                                <div className="mb-3">
                                    <button type="button" className="btn btn-link p-0 text-neon d-flex align-items-center uppercase-mini" style={{ fontSize: '0.7rem' }} onClick={() => setShowAdvancedAP(v => !v)}>
                                        <CIcon icon={cilSettings} className="me-1" /> RADIO_CHANNEL_OPTS
                                    </button>
                                    <CCollapse visible={showAdvancedAP}>
                                        <div className="mt-2 ps-2 border-start border-secondary py-2">
                                            <div className="mb-2 d-flex justify-content-between align-items-center">
                                                <CFormLabel className="small mb-0">BROADCAST_VISIBILITY</CFormLabel>
                                                <CFormCheck type="switch" label={apVisibility} checked={wifi.ap_visibility} onChange={e => update('ap_visibility', e.target.checked)} />
                                            </div>
                                            <div className="mb-2">
                                                <CFormLabel className="small opacity-50 uppercase-mini" style={{ fontSize: '0.6rem' }}>AP_CHANNEL (1-13)</CFormLabel>
                                                <CFormInput className="monospace py-1" style={{ fontSize: '0.8rem' }} type="number" min={1} max={13} value={wifi.ap_chanel} onChange={e => update('ap_chanel', parseInt(e.target.value))} />
                                            </div>
                                            <div className="mb-2">
                                                <CFormLabel className="small opacity-50 uppercase-mini" style={{ fontSize: '0.6rem' }}>MAX_CONNS (0-8)</CFormLabel>
                                                <CFormInput className="monospace py-1" style={{ fontSize: '0.8rem' }} type="number" min={0} max={8} value={wifi.ap_connect} onChange={e => update('ap_connect', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                    </CCollapse>
                                </div>

                                <CButton type="submit" color="primary" className="w-100 mt-4 d-flex align-items-center justify-content-center">
                                    <CIcon icon={cilSave} className="me-2" /> COMMIT_CHANGES
                                </CButton>
                            </CForm>
                        </CCardBody>
                    </CCard>
                </div>

                {/* WiFi Scan */}
                <div className="col-md-8">
                    <CCard className="border-neon h-100">
                        <CCardHeader className="d-flex justify-content-between align-items-center">
                            <span>AVAILABLE_WIFI_SECTORS</span>
                            <CBadge className="bg-glass text-neon border-neon" shape="rounded-pill">{count} NODES_FOUND</CBadge>
                        </CCardHeader>
                        <CCardBody className={find === 0 ? 'd-flex flex-column align-items-center justify-content-center' : ''}>
                            {find === 0 ? (
                                <div className="text-center py-5">
                                    <div className="d-inline-block p-4 rounded-circle mb-4 pulse" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid var(--neon-primary)' }}>
                                        <CIcon icon={cilWifiSignal4} className="text-neon" style={{ height: 60, width: 60 }} />
                                    </div>
                                    <h5 className="text-neon text-uppercase mt-2 mb-4 monospace" style={{ letterSpacing: 2 }}>{scanning}</h5>
                                    {scan ? (
                                        <CButton color="primary" disabled className="px-5 py-2">
                                            <CSpinner size="sm" className="me-2" /> SCANNING_FRQS...
                                        </CButton>
                                    ) : (
                                        <CButton color="primary" onClick={getWifiScan} className="d-inline-flex align-items-center px-5 py-2">
                                            <CIcon icon={cilSearch} className="me-2" /> INITIATE_SCAN
                                        </CButton>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <CTable borderless hover responsive className="monospace text-white-50 mt-2">
                                        <CTableHead>
                                            <CTableRow className="border-bottom border-secondary">
                                                <CTableHeaderCell className="text-info small uppercase-mini">SSID_IDENTIFIER</CTableHeaderCell>
                                                <CTableHeaderCell className="text-info small uppercase-mini">RSSI_LVL</CTableHeaderCell>
                                                <CTableHeaderCell className="d-none d-sm-table-cell text-info small uppercase-mini">PHYSICAL_ADDR</CTableHeaderCell>
                                                <CTableHeaderCell className="d-none d-sm-table-cell text-info small uppercase-mini">SECURITY</CTableHeaderCell>
                                                <CTableHeaderCell className="text-info small text-end uppercase-mini">ACTION</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            {networks.data?.map(({ n, ssid, channel, rssi, bssid, secure }) => (
                                                <CTableRow key={n} className="neon-row-hover">
                                                    <CTableDataCell className="py-2 text-white"><span className="text-neon">{ssid}</span> <span className="opacity-50">| CH_{channel}</span></CTableDataCell>
                                                    <CTableDataCell className="py-2">{rssi} dBm</CTableDataCell>
                                                    <CTableDataCell className="d-none d-sm-table-cell py-2 small opacity-50">{bssid}</CTableDataCell>
                                                    <CTableDataCell className="d-none d-sm-table-cell py-2">
                                                        <CIcon icon={secure !== 'Open' ? cilLockLocked : cilWifiSignal4} className="me-1 opacity-75" size="sm" style={{ color: 'var(--neon-primary)' }} />
                                                        <span className="small">{secure}</span>
                                                    </CTableDataCell>
                                                    <CTableDataCell className="py-2 text-end">
                                                        <CButton size="sm" color="primary" variant="outline" onClick={() => selectWiFi(ssid)}>
                                                            <CIcon icon={cilCheck} />
                                                        </CButton>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            ))}
                                        </CTableBody>
                                    </CTable>
                                    {!scan && (
                                        <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 text-end">
                                            <CButton color="primary" variant="outline" onClick={getWifiScan} className="px-4 d-inline-flex align-items-center">
                                                <CIcon icon={cilSearch} className="me-2" /> RE_SYNC_WIFI
                                            </CButton>
                                        </div>
                                    )}
                                </>
                            )}
                        </CCardBody>
                    </CCard>
                </div>
            </div>
        </CContainer>
    )
}

export default WiFi
