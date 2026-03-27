import { useState, useEffect, useMemo } from 'react'
import useApp from './useApp'
import {
  getCloudSettings as getCloudSettingsService,
  postCloudSettings as postCloudSettingsService
} from '../service/cloudService'

const useCloud = () => {
  const { ToastMsgError, ToastMsgSuccess, swal } = useApp()

  const [data, setData] = useState({
    connection: {
      mqtt_cloud_enable: false, mqtt_user: '', mqtt_password: '',
      mqtt_server: '', mqtt_cloud_id: '', mqtt_port: 0,
      mqtt_retain: false, mqtt_qos: 0,
      mqtt_topic_publish: 'cat1/acb/up', mqtt_topic_subscribe: 'cat1/acb/down/imei'
    },
    datos: { mqtt_time_send: false, mqtt_time_interval: 0, mqtt_time_unit: 1, mqtt_status_send: false, mqtt_custom_message: '' }
  })

  useEffect(() => { getCloudSettings() }, [])

  const handleSubmit = (form) => {
    let title = 'Guardar Parámetros'
    let text = '¿Está seguro de guardar estos parámetros?'

    if (form === 'connection') {
      title = 'Guardar Conexión MQTT'
      text = '¿Está seguro de guardar los parámetros de la Conexión MQTT?'
    } else if (form === 'data') {
      title = 'Guardar Datos MQTT'
      text = '¿Está seguro de guardar los parámetros del envío de Datos MQTT?'
    }

    swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        postCloudSettings(form)
      }
    })
  }

  const getCloudSettings = async () => {
    try {
      const datos = await getCloudSettingsService()
      if (datos.code === 1) {
        setData({
          ...datos.data,
          meta: datos.meta
        })
      }
    } catch (err) { ToastMsgError(`Error al cargar los datos: ${err}`, 5000) }
  }

  const postCloudSettings = async (cloudUrl) => {
    try {
      const datos = await postCloudSettingsService(cloudUrl, data)
      if (datos.save) {
        const msg = cloudUrl === 'connection' ? 'de la Conexión' : 'de los Datos'
        ToastMsgSuccess(`Configuración ${msg} Cloud guardada correctamente`, 5000)
        getCloudSettings()
      }
    } catch (err) { ToastMsgError(`Error al guardar los parámetros Cloud: ${err}`, 5000) }
  }

  const updateConn = (field, value) =>
    setData(prev => ({
      ...prev,
      connection: { ...prev.connection, [field]: value }
    }))

  const updateDatos = (field, value) =>
    setData(prev => ({ ...prev, datos: { ...prev.datos, [field]: value } }))

  const cloudEnable = useMemo(() => data.connection?.mqtt_cloud_enable ? 'Si' : 'No', [data.connection?.mqtt_cloud_enable])

  return { data, setData, cloudEnable, handleSubmit, updateConn, updateDatos }
}

export default useCloud
