import React from 'react'
import { CContainer, CCard, CCardBody, CProgress, CTable, CTableBody, CTableRow, CTableDataCell, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilBarcode,
    cilCloud,
    cilWifiSignal4,
    cilSignalCellular4,
    cilMemory,
    cilSatelite,
    cilGlobeAlt,
    cilStorage,
    cilReload,
    cilClock
} from '@coreui/icons'
import useIndex from '../hook/useIndex'

const Index = () => {
    const {
        indexDatos, wifiStatus, mqttStatus, wifiConn, mqttConn,
        wifiClass01, mqttClass01, wifiClass02, mqttClass02, wifiClass03, mqttClass03,
        spiffsUsed, ramFree
    } = useIndex()

    return (
        <div className="px-2">
            {/* Top stat cards */}
            {/* Top stat cards */}
            <div className="row g-2 mb-2">
                <div className="col-md-6 col-xl-3">
                    <CCard className="h-100 border-neon">
                        <CCardBody className="d-flex align-items-center justify-content-between p-3">
                            <CIcon icon={cilBarcode} size="xl" className="text-info opacity-75" />
                            <div className="text-end">
                                <p className="fs-6 fw-bold mb-0 text-info">DEVICE</p>
                                <p className="mb-0 small text-white opacity-75 monospace">{indexDatos.device_serial || 'ESP32000000'}</p>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className={`h-100 ${indexDatos.mqtt_online ? 'border-neon' : 'border-danger'}`}>
                        <CCardBody className="d-flex align-items-center justify-content-between p-3">
                            <CIcon icon={cilCloud} size="xl" className={indexDatos.mqtt_online ? 'text-info' : 'text-danger'} />
                            <div className="text-end">
                                <p className="fs-6 fw-bold mb-0">PROTOCOL</p>
                                <p className="mb-0 small opacity-75 monospace">{mqttStatus}</p>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className={`h-100 ${indexDatos.wifi_online ? 'border-neon' : 'border-warning'}`}>
                        <CCardBody className="d-flex align-items-center justify-content-between p-3">
                            <div className="text-start">
                                <p className="fs-6 fw-bold mb-0">WIFI_LINK</p>
                                <p className="mb-0 small opacity-75 monospace">{wifiStatus}</p>
                            </div>
                            <CIcon icon={cilWifiSignal4} size="xl" className={indexDatos.wifi_online ? '' : 'text-warning'} style={indexDatos.wifi_online ? { color: 'var(--neon-primary)' } : {}} />
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6 col-xl-3">
                    <CCard className="h-100 border-neon">
                        <CCardBody className="d-flex align-items-center justify-content-between p-3">
                            <div className="text-start">
                                <p className="fs-6 fw-bold mb-0" style={{ color: 'var(--neon-primary)' }}>RSSI</p>
                                <p className="mb-0 small monospace" style={{ color: 'var(--neon-primary)' }}>{indexDatos.wifi_rssi} dBm</p>
                            </div>
                            <CIcon icon={cilSignalCellular4} size="xl" style={{ color: 'var(--neon-primary)' }} className="opacity-75" />
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Stats row */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <CCard className="border-neon">
                        <CCardBody className="p-3">
                            <div className="row text-center">
                                <div className="col-4 border-end border-secondary">
                                    <div className="py-1">
                                        <CIcon icon={cilMemory} size="xl" style={{ color: 'var(--neon-primary)' }} className="mb-1" />
                                        <p className="fs-6 fw-bold mb-0 monospace">{ramFree.toFixed(2)}%</p>
                                        <p className="text-muted small mb-0 uppercase-mini">RAM_FREE</p>
                                    </div>
                                </div>
                                <div className="col-4 border-end border-secondary">
                                    <div className="py-1">
                                        <CIcon icon={cilSatelite} size="xl" style={{ color: 'var(--neon-primary)' }} className="mb-1" />
                                        <p className="fs-6 fw-bold mb-0 monospace">{indexDatos.wifi_signal || 0}%</p>
                                        <p className="text-muted small mb-0 uppercase-mini">SIGNAL</p>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="py-1">
                                        <CIcon icon={cilGlobeAlt} size="xl" className="text-info mb-1" />
                                        <p className="fs-6 fw-bold mb-0 monospace">{indexDatos.mqtt_activity || 'IDLE'}</p>
                                        <p className="text-muted small mb-0 uppercase-mini">ACTIVITY</p>
                                    </div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6">
                    <CCard className="border-neon" style={{ background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.05) 0%, rgba(255, 0, 102, 0.05) 100%)' }}>
                        <CCardBody className="p-3">
                            <div className="row text-center">
                                <div className="col-4 border-end border-secondary">
                                    <div className="py-1">
                                        <CIcon icon={cilStorage} size="xl" className="text-info mb-1 opacity-75" />
                                        <p className="fs-6 fw-bold mb-0 monospace">{spiffsUsed.toFixed(2)}%</p>
                                        <p className="text-muted small mb-0 uppercase-mini">STORAGE</p>
                                    </div>
                                </div>
                                <div className="col-4 border-end border-secondary">
                                    <div className="py-1">
                                        <CIcon icon={cilReload} size="xl" className="text-info mb-1 opacity-75" />
                                        <p className="fs-6 fw-bold mb-0 monospace">{indexDatos.device_restart || 0}</p>
                                        <p className="text-muted small mb-0 uppercase-mini">REBOOTS</p>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="py-1">
                                        <CIcon icon={cilClock} size="xl" className="text-info mb-1 opacity-75" />
                                        <p className="fs-6 fw-bold mb-0 monospace" style={{ fontSize: '0.9rem' }}>{indexDatos.device_time_active || '0:00:00'}</p>
                                        <p className="text-muted small mb-0 uppercase-mini">UPTIME</p>
                                    </div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Cloud & WiFi tables */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <CCard>
                        <div className={`progress rounded-0`} style={{ height: 3 }}>
                            <div className={`progress-bar ${mqttClass02}`} style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Protocolo</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1">Estado MQTT:</CTableDataCell><CTableDataCell className="py-1"><CBadge color={indexDatos.mqtt_online ? 'success' : 'danger'}>{mqttConn}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Servidor MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_server || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Usuario MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_user || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Cliente ID MQTT:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.mqtt_cloud_id || 'ESP3200000000000'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Actividad:</CTableDataCell><CTableDataCell className="py-1"><CBadge color="secondary">{indexDatos.mqtt_activity || 'Unknown'}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Ruta del Tópico:</CTableDataCell><CTableDataCell className="py-1">v1/devices/{indexDatos.mqtt_user}/{indexDatos.device_serial}/#</CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
                <div className="col-md-6">
                    <CCard>
                        <div className="progress rounded-0" style={{ height: 3 }}>
                            <div className={`progress-bar ${wifiClass02}`} style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Inalámbrico</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1">Estado WiFi:</CTableDataCell><CTableDataCell className="py-1"><CBadge color={indexDatos.wifi_online ? 'success' : 'danger'}>{wifiConn}</CBadge></CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">SSID WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_ssid || 'N/A'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">IP WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_ipv4 || '000.000.000.000'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">MAC WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_mac || '00:00:00:00:00:00'}</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">RSSI WiFi:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.wifi_rssi || 0} dBm</CTableDataCell></CTableRow>
                                    <CTableRow><CTableDataCell className="py-1">Modo WiFi:</CTableDataCell><CTableDataCell className="py-1"><CBadge color="primary">{indexDatos.wifi_mode || 'Unknown'}</CBadge></CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
            </div>

            {/* Hardware & Software */}
            <div className="row mb-2">
                <div className="col-12">
                    <CCard>
                        <div className="progress rounded-0" style={{ height: 3 }}>
                            <div className="progress-bar bg-info" style={{ width: '100%' }} />
                        </div>
                        <CCardBody className="p-2">
                            <p className="fw-semibold mb-1 small">Hardware &amp; Software</p>
                            <CTable striped borderless small className="mb-0" style={{ fontSize: '0.85em' }}>
                                <CTableBody>
                                    <CTableRow><CTableDataCell className="py-1" style={{ width: '40%' }}>Número de Serie:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_serial || 'ESP3200000000000'}</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3" style={{ width: '30%' }}>Versión del Firmware:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_fw_version || 'v0.0.00-Build-00000000'}</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">SDK:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_sdk || 'v0.0.0-0-000000000'}</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">Versión del Hardware:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_hw_version || 'ADMINIIOT32 v0'}</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">CPU FREQ:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_cpu_clock || 0} MHz</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">RAM SIZE:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_ram_size / 1000 || 35.08).toFixed(2)} KB</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">FLASH SIZE:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_flash_size || 4.0} MB</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">SPIFFS SIZE:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_spiffs_total / 1000 || 15.31).toFixed(2)} KB</CTableDataCell></CTableRow>

                                    <CTableRow><CTableDataCell className="py-1">SPIFFS USED:</CTableDataCell><CTableDataCell className="py-1">{(indexDatos.device_spiffs_used / 1000 || 0).toFixed(2)} KB</CTableDataCell>
                                        <CTableDataCell className="py-1 border-start ps-3">Fabricante:</CTableDataCell><CTableDataCell className="py-1">{indexDatos.device_manufacturer || 'IOTHOST'}</CTableDataCell></CTableRow>
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </div>
            </div>
        </div>
    )
}

export default Index
