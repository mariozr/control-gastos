import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { formatearMonto } from "../utils/formatearMonto";
import BotonExportar from "./BotonExportar";
import { useToast } from "../hooks/useToast";

export default function ListaGastos({
  onGastoEliminado,
  onGastoEditado,
  onError,
}) {
  const [gastos, setGastos] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalMensual, setTotalMensual] = useState(0);
  const [mostrarTotalMensual, setMostrarTotalMensual] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("todas");
  const [filtroTiempo, setFiltroTiempo] = useState("todos");
  const [fechasDisponibles, setFechasDisponibles] = useState({
    semanas: [],
    meses: [],
  });
  const [semanaSeleccionada, setSemanaSeleccionada] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [formasPagoDisponibles, setFormasPagoDisponibles] = useState([]);
  const [formasPagoDisponiblesObj, setFormasPagoDisponiblesObj] = useState({});
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtrosExportar, setFiltrosExportar] = useState({
    categoria: "todos",
    formaPago: "todas",
    tiempo: "todos",
    mesSeleccionado: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [isMobile, setIsMobile] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Estados para edición
  const [editandoGasto, setEditandoGasto] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [editando, setEditando] = useState(false);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split("-");
    return `${day}/${month}/${year}`;
  };

  const getSemana = (fecha) => {
    const date = new Date(fecha);
    const inicio = new Date(date.getFullYear(), 0, 1);
    const dias = Math.floor((date - inicio) / (24 * 60 * 60 * 1000));
    return Math.ceil((dias + inicio.getDay() + 1) / 7);
  };

  const getMesActual = () => {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  };

  const obtenerFechasDisponibles = (gastosData) => {
    const semanasSet = new Set();
    const mesesSet = new Set();

    gastosData.forEach((gasto) => {
      const fecha = new Date(gasto.fecha);
      const semana = getSemana(fecha);
      const año = fecha.getFullYear();
      const semanaKey = `${año}-Semana ${semana}`;
      semanasSet.add(semanaKey);

      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      mesesSet.add(mesKey);
    });

    return {
      semanas: Array.from(semanasSet).sort(),
      meses: Array.from(mesesSet).sort(),
    };
  };

  const cargarCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("nombre")
      .order("nombre");

    if (!error && data) {
      setCategoriasDisponibles(data.map((cat) => cat.nombre));
    } else {
      setCategoriasDisponibles([
        "Comida",
        "Transporte",
        "Entretenimiento",
        "Servicios",
        "Salud",
        "Otros",
      ]);
    }
  };

  const cargarFormasPago = async () => {
    const { data, error } = await supabase
      .from("formas_pago")
      .select("*")
      .order("nombre");

    if (!error && data) {
      const nombres = data.map((fp) => fp.nombre);
      setFormasPagoDisponibles(nombres);
      const obj = {};
      data.forEach((fp) => {
        obj[fp.nombre] = { color: fp.color || "#10B981" };
      });
      setFormasPagoDisponiblesObj(obj);
    } else {
      setFormasPagoDisponibles([
        "Efectivo",
        "Tarjeta de Crédito",
        "Tarjeta de Débito",
        "Transferencia",
        "Mercado Pago",
        "Otro",
      ]);
      const objDefault = {
        Efectivo: { color: "#10B981" },
        "Tarjeta de Crédito": { color: "#3B82F6" },
        "Tarjeta de Débito": { color: "#6366F1" },
        Transferencia: { color: "#8B5CF6" },
        "Mercado Pago": { color: "#F59E0B" },
        Otro: { color: "#6B7280" },
      };
      setFormasPagoDisponiblesObj(objDefault);
    }
  };

  const getColorFormaPago = (formaPagoNombre) => {
    const formaPago = formasPagoDisponiblesObj[formaPagoNombre];
    if (formaPago && formaPago.color) {
      return { bg: `${formaPago.color}20`, text: formaPago.color };
    }
    return { bg: "#E5E7EB", text: "#6B7280" };
  };

  const cargarGastos = async () => {
    setLoading(true);
    let query = supabase
      .from("gastos")
      .select("*")
      .order("fecha", { ascending: false });

    if (filtroCategoria !== "todos") {
      query = query.eq("categoria", filtroCategoria);
    }

    if (filtroFormaPago !== "todas") {
      query = query.eq("forma_pago", filtroFormaPago);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error:", error);
      alert("Error al cargar gastos: " + error.message);
    } else {
      let gastosFiltrados = data || [];
      let gastosMensuales = [];

      // Calcular gastos del mes actual (sin ningún filtro de tiempo)
      const mesActual = getMesActual();
      gastosMensuales = (data || []).filter((gasto) => {
        const fechaGasto = gasto.fecha;
        const añoGasto = fechaGasto.substring(0, 4);
        const mesGasto = fechaGasto.substring(5, 7);
        return `${añoGasto}-${mesGasto}` === mesActual;
      });

      // Aplicar filtros de tiempo a los gastos mostrados
      if (filtroTiempo === "semana" && semanaSeleccionada) {
        const [año, semanaNum] = semanaSeleccionada.split("-Semana ");
        gastosFiltrados = gastosFiltrados.filter((gasto) => {
          const fecha = new Date(gasto.fecha);
          const semana = getSemana(fecha);
          return (
            fecha.getFullYear() === parseInt(año) &&
            semana === parseInt(semanaNum)
          );
        });
      } else if (filtroTiempo === "mes" && mesSeleccionado) {
        const [año, mes] = mesSeleccionado.split("-");
        gastosFiltrados = gastosFiltrados.filter((gasto) => {
          const fechaGasto = gasto.fecha;
          const añoGasto = fechaGasto.substring(0, 4);
          const mesGasto = fechaGasto.substring(5, 7);
          return añoGasto === año && mesGasto === mes;
        });
      } else if (filtroTiempo === "personalizado" && fechaInicio && fechaFin) {
        gastosFiltrados = gastosFiltrados.filter((gasto) => {
          const fechaGasto = gasto.fecha;
          return fechaGasto >= fechaInicio && fechaGasto <= fechaFin;
        });
      }

      // Si no hay filtros de tiempo, mostrar los gastos del mes actual
      if (
        filtroTiempo === "todos" &&
        !semanaSeleccionada &&
        !mesSeleccionado &&
        !fechaInicio &&
        !fechaFin
      ) {
        setMostrarTotalMensual(true);
        // Los gastos mostrados también deberían ser los del mes actual
        gastosFiltrados = gastosMensuales;
      } else {
        setMostrarTotalMensual(false);
      }

      const fechas = obtenerFechasDisponibles(data || []);
      setFechasDisponibles(fechas);

      setGastos(gastosFiltrados);
      const suma = gastosFiltrados.reduce((acc, gasto) => acc + gasto.monto, 0);
      setTotal(suma);

      // Calcular total mensual (mes actual, sin filtros)
      const sumaMensual = gastosMensuales.reduce(
        (acc, gasto) => acc + gasto.monto,
        0,
      );
      setTotalMensual(sumaMensual);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarCategorias();
    cargarFormasPago();
  }, []);

  useEffect(() => {
    cargarGastos();
  }, [
    filtroCategoria,
    filtroFormaPago,
    filtroTiempo,
    semanaSeleccionada,
    mesSeleccionado,
    fechaInicio,
    fechaFin,
  ]);

  useEffect(() => {
    setFiltrosExportar({
      categoria: filtroCategoria,
      formaPago: filtroFormaPago,
      tiempo: filtroTiempo,
      mesSeleccionado: mesSeleccionado,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    });
  }, [
    filtroCategoria,
    filtroFormaPago,
    filtroTiempo,
    mesSeleccionado,
    fechaInicio,
    fechaFin,
  ]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const eliminarGasto = async (id) => {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) {
        /* alert("Error al eliminar: " + error.message); */
        onError("Error al eliminar: " + error.message);
      } else {
        cargarGastos();
        if (onGastoEliminado) {
          onGastoEliminado();
        }
      }
    }
  };

  const abrirModalEdicion = (gasto) => {
    setEditandoGasto({ ...gasto });
    setMostrarModalEdicion(true);
  };

  const handleEditChange = (e) => {
    setEditandoGasto({
      ...editandoGasto,
      [e.target.name]: e.target.value,
    });
  };

  const guardarEdicion = async () => {
    if (!editandoGasto.descripcion.trim()) {
      /* alert("Por favor ingresa una descripción"); */
      onError("Por favor ingresa una descripción");
      return;
    }

    if (parseFloat(editandoGasto.monto) <= 0) {
      /* alert("Por favor ingresa un monto válido"); */
      onError("Por favor ingresa un monto válido");
      return;
    }

    setEditando(true);

    const { error } = await supabase
      .from("gastos")
      .update({
        descripcion: editandoGasto.descripcion,
        monto: parseFloat(editandoGasto.monto),
        categoria: editandoGasto.categoria,
        forma_pago: editandoGasto.forma_pago,
        fecha: editandoGasto.fecha,
      })
      .eq("id", editandoGasto.id);

    if (error) {
      console.error("Error al editar:", error);
      /* alert("Error al editar gasto: " + error.message); */
      onError("Error al editar gasto: " + error.message);
    } else {
      /* alert("Gasto editado correctamente"); */
      onGastoEditado("Gasto editado correctamente", "success");
      setMostrarModalEdicion(false);
      setEditandoGasto(null);
      cargarGastos();
    }
    setEditando(false);
  };

  const handleFiltroTiempoChange = (tipo) => {
    setFiltroTiempo(tipo);
    setSemanaSeleccionada("");
    setMesSeleccionado("");
    setFechaInicio("");
    setFechaFin("");
  };

  const limpiarFiltroPersonalizado = () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroTiempo("todos");
  };

  const getNombreMes = (mesKey) => {
    if (!mesKey) return "";
    const [año, mes] = mesKey.split("-");
    const fecha = new Date(parseInt(año), parseInt(mes) - 1, 1);
    return fecha.toLocaleString("es", { month: "long", year: "numeric" });
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gastos
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {mostrarTotalMensual
                  ? "Total del mes"
                  : "Total (filtro aplicado)"}
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatearMonto(mostrarTotalMensual ? totalMensual : total)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <BotonExportar filtros={filtrosExportar} />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
              Categoría
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todos">Todas las categorías</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
              Forma de Pago
            </label>
            <select
              value={filtroFormaPago}
              onChange={(e) => setFiltroFormaPago(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todas">Todas las formas de pago</option>
              {formasPagoDisponibles.map((fp) => (
                <option key={fp} value={fp}>
                  {fp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
              Período de tiempo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => handleFiltroTiempoChange("todos")}
                className={`px-3 py-2 rounded-md transition ${
                  filtroTiempo === "todos"
                    ? "bg-blue-600 text-white dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Mes actual
              </button>
              <button
                onClick={() => handleFiltroTiempoChange("semana")}
                className={`px-3 py-2 rounded-md transition ${
                  filtroTiempo === "semana"
                    ? "bg-blue-600 text-white dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Por Semana
              </button>
              <button
                onClick={() => handleFiltroTiempoChange("mes")}
                className={`px-3 py-2 rounded-md transition ${
                  filtroTiempo === "mes"
                    ? "bg-blue-600 text-white dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Por Mes
              </button>
              <button
                onClick={() => handleFiltroTiempoChange("personalizado")}
                className={`px-3 py-2 rounded-md transition ${
                  filtroTiempo === "personalizado"
                    ? "bg-blue-600 text-white dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Personalizado
              </button>
            </div>

            {filtroTiempo === "semana" && (
              <select
                value={semanaSeleccionada}
                onChange={(e) => setSemanaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:focus:ring-blue-500"
              >
                <option value="">Seleccionar semana</option>
                {fechasDisponibles.semanas.map((semana) => (
                  <option key={semana} value={semana}>
                    {semana}
                  </option>
                ))}
              </select>
            )}

            {filtroTiempo === "mes" && (
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:focus:ring-blue-500"
              >
                <option value="">Seleccionar mes</option>
                {fechasDisponibles.meses.map((mesKey) => (
                  <option key={mesKey} value={mesKey}>
                    {getNombreMes(mesKey)}
                  </option>
                ))}
              </select>
            )}

            {filtroTiempo === "personalizado" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={limpiarFiltroPersonalizado}
                  className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Cargando...
          </p>
        ) : gastos.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay gastos registrados con los filtros seleccionados
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gastos.map((gasto) => {
              const colorStyle = getColorFormaPago(
                gasto.forma_pago || "Efectivo",
              );
              return (
                <div
                  key={gasto.id}
                  className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-400">
                        {gasto.descripcion}
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        {gasto.categoria}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          backgroundColor: colorStyle.bg,
                          color: colorStyle.text,
                        }}
                      >
                        💳 {gasto.forma_pago || "Efectivo"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatearFecha(gasto.fecha)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatearMonto(gasto.monto)}
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={() => abrirModalEdicion(gasto)}
                        className="text-blue-500 hover:text-blue-700 text-sm dark:text-blue-400 dark:hover:text-blue-600"
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarGasto(gasto.id)}
                        className="text-red-500 hover:text-red-700 text-sm dark:text-red-400 dark:hover:text-red-600"
                        title="Eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {mostrarModalEdicion && editandoGasto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-400">
                Editar Gasto
              </h3>
              <button
                onClick={() => {
                  setMostrarModalEdicion(false);
                  setEditandoGasto(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl dark:text-gray-400 dark:hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                  Descripción
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={editandoGasto.descripcion}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Compra supermercado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                  Monto
                </label>
                <input
                  type="number"
                  name="monto"
                  value={editandoGasto.monto}
                  onChange={handleEditChange}
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={editandoGasto.categoria}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                  Forma de Pago
                </label>
                <select
                  name="forma_pago"
                  value={editandoGasto.forma_pago}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {formasPagoDisponibles.map((fp) => (
                    <option key={fp} value={fp}>
                      {fp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={editandoGasto.fecha}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={guardarEdicion}
                disabled={editando}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-500"
              >
                {editando ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                onClick={() => {
                  setMostrarModalEdicion(false);
                  setEditandoGasto(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
