'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, Trash2, Edit, DollarSign, PieChart, BarChart3, Download, Target, Settings, TrendingUp, Goal } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

type Gasto = {
  id: string
  nombre: string
  monto: number
  prioridad: number
  categoria: string
  fecha: string
}

type Meta = {
  categoria: string
  monto: number
}

const CATEGORIAS_DEFAULT = ['Vivienda', 'Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Otros']
const COLORES = ['#486f99', '#5379a4', '#5d83ae', '#688db9', '#7398c4', '#88a7d0']

function generarId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function GestionGastos() {
  const [ingresos, setIngresos] = useState(0)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [nombreGasto, setNombreGasto] = useState('')
  const [montoGasto, setMontoGasto] = useState('')
  const [prioridadGasto, setPrioridadGasto] = useState('')
  const [categoriaGasto, setCategoriaGasto] = useState(CATEGORIAS_DEFAULT[0])
  const [gastoEditando, setGastoEditando] = useState<string | null>(null)
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [metas, setMetas] = useState<Meta[]>([])
  const [metaActual, setMetaActual] = useState<Meta>({ categoria: '', monto: 0 })

  useEffect(() => {
    const ingresosGuardados = localStorage.getItem('ingresos')
    const gastosGuardados = localStorage.getItem('gastos')
    const categoriasGuardadas = localStorage.getItem('categorias')
    const metasGuardadas = localStorage.getItem('metas')
    if (ingresosGuardados) setIngresos(JSON.parse(ingresosGuardados))
    if (gastosGuardados) setGastos(JSON.parse(gastosGuardados))
    if (categoriasGuardadas) setCategorias(JSON.parse(categoriasGuardadas))
    if (metasGuardadas) setMetas(JSON.parse(metasGuardadas))
  }, [])

  useEffect(() => {
    localStorage.setItem('ingresos', JSON.stringify(ingresos))
    localStorage.setItem('gastos', JSON.stringify(gastos))
    localStorage.setItem('categorias', JSON.stringify(categorias))
    localStorage.setItem('metas', JSON.stringify(metas))
  }, [ingresos, gastos, categorias, metas])

  const priorizarGastos = (gastos: Gasto[], ingresos: number): Gasto[] => {
    const gastosOrdenados = [...gastos].sort((a, b) => b.prioridad - a.prioridad)
    let presupuestoRestante = ingresos
    return gastosOrdenados.filter(gasto => {
      if (presupuestoRestante >= gasto.monto) {
        presupuestoRestante -= gasto.monto
        return true
      }
      return false
    })
  }

  const ajustarAhorro = (gastosPriorizados: Gasto[], ingresos: number): number => {
    const totalGastos = gastosPriorizados.reduce((sum, gasto) => sum + gasto.monto, 0)
    const ahorroRecomendado = Math.max(ingresos - totalGastos, 0)
    return Math.round((ahorroRecomendado / ingresos) * 100)
  }

  const agregarOEditarGasto = () => {
    if (nombreGasto && montoGasto && prioridadGasto) {
      const nuevoGasto: Gasto = {
        id: gastoEditando || generarId(),
        nombre: nombreGasto,
        monto: parseFloat(montoGasto),
        prioridad: parseInt(prioridadGasto),
        categoria: categoriaGasto,
        fecha: new Date().toISOString()
      }

      if (gastoEditando) {
        setGastos(gastos.map(g => g.id === gastoEditando ? nuevoGasto : g))
      } else {
        setGastos([...gastos, nuevoGasto])
      }

      setNombreGasto('')
      setMontoGasto('')
      setPrioridadGasto('')
      setCategoriaGasto(CATEGORIAS_DEFAULT[0])
      setGastoEditando(null)
    }
  }

  const editarGasto = (id: string) => {
    const gasto = gastos.find(g => g.id === id)
    if (gasto) {
      setNombreGasto(gasto.nombre)
      setMontoGasto(gasto.monto.toString())
      setPrioridadGasto(gasto.prioridad.toString())
      setCategoriaGasto(gasto.categoria)
      setGastoEditando(id)
    }
  }

  const eliminarGasto = (id: string) => {
    setGastos(gastos.filter(g => g.id !== id))
  }

  const exportarDatos = () => {
    const datos = {
      ingresos,
      gastos,
      metas,
      fecha: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gestion-gastos.json'
    a.click()
  }

  const predecirGastosMensuales = () => {
    const gastosPorMes = gastos.reduce((acc, gasto) => {
      const mes = new Date(gasto.fecha).getMonth()
      acc[mes] = (acc[mes] || 0) + gasto.monto
      return acc
    }, {} as Record<number, number>)

    const promedioMensual = Object.values(gastosPorMes).reduce((a, b) => a + b, 0) / 
                           Math.max(1, Object.keys(gastosPorMes).length)

    return Math.round(promedioMensual)
  }

  const verificarMetas = () => {
    const alertas = []
    for (const meta of metas) {
      const gastosCategoria = gastos
        .filter(g => g.categoria === meta.categoria)
        .reduce((sum, g) => sum + g.monto, 0)
      
      if (gastosCategoria > meta.monto) {
        alertas.push(`Has superado tu meta en ${meta.categoria} por $${gastosCategoria - meta.monto}`)
      }
    }
    return alertas
  }

  const gastosPriorizados = priorizarGastos(gastos, ingresos)
  const porcentajeAhorro = ajustarAhorro(gastosPriorizados, ingresos)

  const datosPastel = categorias.map(categoria => ({
    name: categoria,
    value: gastos.filter(g => g.categoria === categoria).reduce((sum, g) => sum + g.monto, 0)
  }))

  const totalGastos = datosPastel.reduce((sum, dato) => sum + dato.value, 0)

  const proyeccionFutura = (meses: number) => {
    const gastosProyectados = gastos.reduce((sum, g) => sum + g.monto, 0) * meses
    const ingresosProyectados = ingresos * meses
    const ahorroProyectado = ingresosProyectados - gastosProyectados
    return {
      gastosProyectados,
      ingresosProyectados,
      ahorroProyectado
    }
  }

  const proyeccion = proyeccionFutura(6)  // Proyección a 6 meses

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e2e8f3] to-[#c4d2e7] p-4">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-[#486f99]">Gestión de Gastos Inteligente</h1>
        
        {/* Alerts Section */}
        <div className="space-y-2">
          {verificarMetas().map((alerta, index) => (
            <Alert key={index} className="bg-[#5379a4] text-white">
              <AlertDescription>{alerta}</AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Income Section */}
        <div className="grid gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-[#486f99]" />
              <h2 className="text-2xl font-semibold text-[#486f99]">Ingresos Mensuales</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Ingrese sus ingresos mensuales totales</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={ingresos}
                onChange={(e) => setIngresos(parseFloat(e.target.value))}
                placeholder="Ingrese sus ingresos mensuales"
                className="text-2xl border-[#7398c4]"
              />
              <Button 
                onClick={() => setIngresos(ingresos)} 
                className="bg-[#486f99] hover:bg-[#5379a4]"
              >
                Actualizar
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#486f99] hover:bg-[#5379a4] h-auto py-4">
                  <Target className="mr-2 h-5 w-5" /> 
                  <div>
                    <div className="font-semibold">Establecer Metas</div>
                    <div className="text-xs opacity-90">Definir objetivos de gastos</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Goal className="h-5 w-5" />
                    Gestión de Metas
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="set" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="set">Establecer Meta</TabsTrigger>
                    <TabsTrigger value="view">Ver Metas</TabsTrigger>
                  </TabsList>
                  <TabsContent value="set">
                    <div className="space-y-4">
                      <Select 
                        value={metaActual.categoria} 
                        onValueChange={(val) => setMetaActual({...metaActual, categoria: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Monto máximo"
                        value={metaActual.monto}
                        onChange={(e) => setMetaActual({...metaActual, monto: parseFloat(e.target.value)})}
                      />
                      <Button 
                        onClick={() => {
                          if (metaActual.categoria && metaActual.monto) {
                            setMetas([...metas, metaActual])
                            setMetaActual({ categoria: '', monto: 0 })
                          }
                        }}
                        className="w-full bg-[#486f99] hover:bg-[#5379a4]"
                      >
                        Guardar Meta
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="view">
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        {metas.length === 0 ? (
                          <p className="text-center text-gray-500">No hay metas establecidas</p>
                        ) : (
                          metas.map((meta, index) => {
                            const gastosCategoria = gastos
                              .filter(g => g.categoria === meta.categoria)
                              .reduce((sum, g) => sum + g.monto, 0)
                            const porcentaje = (gastosCategoria / meta.monto) * 100
                            return (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="font-medium">{meta.categoria}</h3>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMetas(metas.filter((_, i) => i !== index))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600">Meta: ${meta.monto}</p>
                                <p className="text-sm text-gray-600">Actual: ${gastosCategoria}</p>
                                <Progress 
                                  value={porcentaje} 
                                  className="mt-2"
                                  indicatorClassName={porcentaje > 100 ? "bg-red-500" : ""}
                                />
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#5d83ae] hover:bg-[#688db9] h-auto py-4">
                  <Settings className="mr-2 h-5 w-5" /> 
                  <div>
                    <div className="font-semibold">Categorías</div>
                    <div className="text-xs opacity-90">Gestionar categorías de gastos</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gestionar Categorías</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nueva categoría"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                  />
                  <Button 
                    onClick={() => {
                      if (nuevaCategoria) {
                        setCategorias([...categorias, nuevaCategoria])
                        setNuevaCategoria('')
                      }
                    }}
                    className="w-full bg-[#486f99] hover:bg-[#5379a4]"
                  >
                    Agregar Categoría
                  </Button>
                  <div className="space-y-2">
                    {categorias.map((cat) => (
                      <div key={cat} className="flex justify-between items-center">
                        <span>{cat}</span>
                        {!CATEGORIAS_DEFAULT.includes(cat) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCategorias(categorias.filter(c => c !== cat))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={exportarDatos}
              className="bg-[#7398c4] hover:bg-[#88a7d0] h-auto py-4"
            >
              <Download className="mr-2 h-5 w-5" /> 
              <div>
                <div className="font-semibold">Exportar Datos</div>
                <div className="text-xs opacity-90">Descargar información en JSON</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Prediction Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#486f99]" />
            <h2 className="text-2xl font-semibold text-[#486f99]">Predicción de Gastos</h2>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Basado en tu historial de gastos, se prevé que el próximo mes gastarás aproximadamente:</p>
            <p className="text-3xl font-bold text-[#486f99]">${predecirGastosMensuales()}</p>
          </div>
        </div>

        {/* Add/Edit Expense and Prioritized Expenses Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
            <div className="flex items-center gap-2 mb-4">
              {gastoEditando ? <Edit className="text-[#486f99]" /> : <PlusCircle className="text-[#486f99]" />}
              <h2 className="text-2xl font-semibold text-[#486f99]">
                {gastoEditando ? 'Editar Gasto' : 'Agregar Nuevo Gasto'}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombreGasto">Nombre del Gasto</Label>
                <Input
                  id="nombreGasto"
                  value={nombreGasto}
                  onChange={(e) => setNombreGasto(e.target.value)}
                  placeholder="Ej: Alquiler, Comida, etc."
                  className="border-[#7398c4]"
                />
              </div>
              <div>
                <Label htmlFor="montoGasto">Monto</Label>
                <Input
                  id="montoGasto"
                  type="number"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  placeholder="Monto del gasto"
                  className="border-[#7398c4]"
                />
              </div>
              <div>
                <Label htmlFor="prioridadGasto">Prioridad (1-10)</Label>
                <Input
                  id="prioridadGasto"
                  type="number"
                  min="1"
                  max="10"
                  value={prioridadGasto}
                  onChange={(e) => setPrioridadGasto(e.target.value)}
                  placeholder="1 (baja) - 10 (alta)"
                  className="border-[#7398c4]"
                />
              </div>
              <div>
                <Label htmlFor="categoriaGasto">Categoría</Label>
                <Select value={categoriaGasto} onValueChange={setCategoriaGasto}>
                  <SelectTrigger className="border-[#7398c4]">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={agregarOEditarGasto} className="w-full bg-[#486f99] hover:bg-[#5379a4]">
                {gastoEditando ? 'Actualizar Gasto' : 'Agregar Gasto'}
              </Button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
            <h2 className="text-2xl font-semibold text-[#486f99] mb-4">Gastos Priorizados</h2>
            <p className="text-sm text-gray-600 mb-4">Lista de gastos ordenados por prioridad</p>
            <ScrollArea className="h-[400px] pr-4">
              <ul className="space-y-2">
                {gastosPriorizados.map((gasto) => (
                  <li key={gasto.id} className="flex justify-between items-center p-2 bg-white rounded shadow">
                    <span>{gasto.nombre}: ${gasto.monto} 
                      <span className="text-xs ml-2 text-gray-500">
                        (Prioridad: {gasto.prioridad}, {gasto.categoria})
                      </span>
                    </span>
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => editarGasto(gasto.id)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => eliminarGasto(gasto.id)}><Trash2 size={16} /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
          <h2 className="text-2xl font-semibold text-[#486f99] mb-4">Resumen del Presupuesto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-[#5d83ae]">Total de Ingresos</p>
              <p className="text-2xl font-bold text-[#486f99]">${ingresos}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#5d83ae]">Total de Gastos Priorizados</p>
              <p className="text-2xl font-bold text-[#486f99]">${gastosPriorizados.reduce((sum, gasto) => sum + gasto.monto, 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#5d83ae]">Ahorro Recomendado</p>
              <p className="text-2xl font-bold text-[#486f99]">{porcentajeAhorro}%</p>
            </div>
          </div>
          <Progress 
            value={porcentajeAhorro} 
            className="h-2"
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="distribucion" className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-[#688db9]">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="distribucion" className="flex items-center bg-[#486f99] text-white data-[state=active]:bg-[#5d83ae]">
              <PieChart className="mr-2" /> Distribución de Gastos
            </TabsTrigger>
            <TabsTrigger value="proyeccion" className="flex items-center bg-[#486f99] text-white data-[state=active]:bg-[#5d83ae]">
              <BarChart3 className="mr-2" /> Proyección a 6 Meses
            </TabsTrigger>
          </TabsList>
          <TabsContent value="distribucion">
            <h3 className="text-xl font-semibold text-[#486f99] mb-4">Distribución de Gastos por Categoría</h3>
            <div className="flex flex-wrap justify-center">
              {datosPastel.map((dato, index) => (
                <div key={dato.name} className="m-2 text-center">
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center text-black font-bold"
                    style={{
                      background: `conic-gradient(${COLORES[index % COLORES.length]} ${(dato.value / totalGastos) * 360}deg, transparent 0deg)`,
                    }}
                  >
                    {Math.round((dato.value / totalGastos) * 100)}%
                  </div>
                  <p className="text-sm font-medium text-[#486f99]">{dato.name}</p>
                  <p className="text-xs text-[#5d83ae]">${dato.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="proyeccion">
            <h3 className="text-xl font-semibold text-[#486f99] mb-4">Proyección a 6 Meses</h3>
            <div className="flex justify-around items-end h-64">
              {['Ingresos', 'Gastos', 'Ahorro'].map((tipo, index) => {
                const valor = [proyeccion.ingresosProyectados, proyeccion.gastosProyectados, proyeccion.ahorroProyectado][index]
                const maxValor = Math.max(proyeccion.ingresosProyectados, proyeccion.gastosProyectados, proyeccion.ahorroProyectado)
                const porcentaje = (valor / maxValor) * 100
                const color = ['bg-[#486f99]', 'bg-[#5d83ae]', 'bg-[#7398c4]'][index]
                return (
                  <div key={tipo} className="flex flex-col items-center">
                    <div
                      className={`w-16 ${color} rounded-t-lg transition-all duration-500 ease-in-out`}
                      style={{ height: `${porcentaje}%` }}
                    />
                    <p className="mt-2 font-medium text-[#486f99]">{tipo}</p>
                    <p className="text-sm text-[#5d83ae]">${valor}</p>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border-2 border-[#688db9] text-center">
          <p className="text-sm text-[#486f99]">
            Desarrollado por estudiantes de la Universidad Tecnológica de Bolívar:
          </p>
          <p className="text-sm font-medium mt-2 text-[#5379a4]">
            Eduardo Alejandro Negrín Pérez<br />
            Fabián Camilo Quintero Pareja<br />
            Santiago Quintero Pareja
          </p>
        </div>
      </div>
    </div>
  )
}