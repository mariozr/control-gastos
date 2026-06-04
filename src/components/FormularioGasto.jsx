import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { formatearMonto } from "../utils/formatearMonto";
import { useToast } from "../hooks/useToast";

// Colores predefinidos para elegir
const COLOR_PRESETS = [
  { nombre: "Verde", valor: "#10B981" },
  { nombre: "Azul", valor: "#3B82F6" },
  { nombre: "Índigo", valor: "#6366F1" },
  { nombre: "Púrpura", valor: "#8B5CF6" },
  { nombre: "Amarillo", valor: "#F59E0B" },
  { nombre: "Rojo", valor: "#EF4444" },
  { nombre: "Rosa", valor: "#EC4899" },
  { nombre: "Gris", valor: "#6B7280" },
  { nombre: "Naranja", valor: "#F97316" },
  { nombre: "Cian", valor: "#06B6D4" },
];

export default function FormularioGasto({ onGastoAgregado, onError }) {
  const [formData, setFormData] = useState({
    descripcion: "",
    monto: "",
    categoria: "",
    forma_pago: "Efectivo",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [categorias, setCategorias] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaFormaPago, setNuevaFormaPago] = useState("");
  const [colorNuevaFormaPago, setColorNuevaFormaPago] = useState("#10B981");
  const [mostrarInputNueva, setMostrarInputNueva] = useState(false);
  const [mostrarInputNuevaPago, setMostrarInputNuevaPago] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre");

      if (error) {
        console.error("Error al cargar categorías:", error);
        setCategorias([
          "Comida",
          "Transporte",
          "Entretenimiento",
          "Servicios",
          "Salud",
          "Otros",
        ]);
      } else if (data && data.length > 0) {
        const nombres = data.map((cat) => cat.nombre);
        setCategorias(nombres);
        if (nombres.length > 0 && !formData.categoria) {
          setFormData((prev) => ({ ...prev, categoria: nombres[0] }));
        }
      } else {
        setCategorias([
          "Comida",
          "Transporte",
          "Entretenimiento",
          "Servicios",
          "Salud",
          "Otros",
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setCategorias([
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
    try {
      const { data, error } = await supabase
        .from("formas_pago")
        .select("*")
        .order("nombre");

      if (error) {
        console.error("Error al cargar formas de pago:", error);
        setFormasPago([
          { nombre: "Efectivo", color: "#10B981" },
          { nombre: "Tarjeta de Crédito", color: "#3B82F6" },
          { nombre: "Tarjeta de Débito", color: "#6366F1" },
          { nombre: "Transferencia", color: "#8B5CF6" },
          { nombre: "Mercado Pago", color: "#F59E0B" },
          { nombre: "Otro", color: "#6B7280" },
        ]);
      } else if (data && data.length > 0) {
        setFormasPago(data);
        if (data.length > 0 && !formData.forma_pago) {
          setFormData((prev) => ({ ...prev, forma_pago: data[0].nombre }));
        }
      } else {
        setFormasPago([
          { nombre: "Efectivo", color: "#10B981" },
          { nombre: "Tarjeta de Crédito", color: "#3B82F6" },
          { nombre: "Tarjeta de Débito", color: "#6366F1" },
          { nombre: "Transferencia", color: "#8B5CF6" },
          { nombre: "Mercado Pago", color: "#F59E0B" },
          { nombre: "Otro", color: "#6B7280" },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingDatos(false);
    }
  };

  useEffect(() => {
    Promise.all([cargarCategorias(), cargarFormasPago()]);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const agregarNuevaCategoria = async () => {
    if (nuevaCategoria.trim() === "") {
      onError("Por favor ingresa un nombre para la categoría");
      return;
    }

    if (
      categorias.some(
        (cat) => cat.toLowerCase() === nuevaCategoria.toLowerCase(),
      )
    ) {
      onError("Esta categoría ya existe");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("categorias")
      .insert([{ nombre: nuevaCategoria }]);

    if (error) {
      onError("Error al agregar categoría: " + error.message);
    } else {
      await cargarCategorias();
      setFormData({ ...formData, categoria: nuevaCategoria });
      setNuevaCategoria("");
      setMostrarInputNueva(false);
      showToast(
        `Categoría "${nuevaCategoria}" agregada correctamente`,
        "success",
      );
    }
    setLoading(false);
  };

  const agregarNuevaFormaPago = async () => {
    if (nuevaFormaPago.trim() === "") {
      onError("Por favor ingresa un nombre para la forma de pago");
      return;
    }

    if (
      formasPago.some(
        (fp) => fp.nombre.toLowerCase() === nuevaFormaPago.toLowerCase(),
      )
    ) {
      onError("Esta forma de pago ya existe");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("formas_pago").insert([
      {
        nombre: nuevaFormaPago,
        color: colorNuevaFormaPago,
      },
    ]);

    if (error) {
      onError("Error al agregar forma de pago: " + error.message);
    } else {
      await cargarFormasPago();
      setFormData({ ...formData, forma_pago: nuevaFormaPago });
      setNuevaFormaPago("");
      setColorNuevaFormaPago("#10B981");
      setMostrarInputNuevaPago(false);
      showToast(
        `Forma de pago "${nuevaFormaPago}" agregada correctamente`,
        "success",
      );
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.descripcion.trim()) {
      onError("Por favor ingresa una descripción");
      setLoading(false);
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      onError("Por favor ingresa un monto válido");
      setLoading(false);
      return;
    }

    if (!formData.categoria) {
      onError("Por favor selecciona una categoría");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("gastos")
      .insert([
        {
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          categoria: formData.categoria,
          forma_pago: formData.forma_pago,
          fecha: formData.fecha,
        },
      ])
      .select();

    if (error) {
      console.error("Error completo:", error);
      onError("Error al agregar gasto: " + error.message);
    } else {
      setFormData({
        descripcion: "",
        monto: "",
        categoria: formData.categoria,
        forma_pago: formData.forma_pago,
        fecha: new Date().toISOString().split("T")[0],
      });
      onGastoAgregado(data[0]);
      showToast("Gasto agregado correctamente", "success");
    }
    setLoading(false);
  };

  // Función para obtener el color de una forma de pago
  const getColorFormaPago = (nombre) => {
    const forma = formasPago.find((fp) => fp.nombre === nombre);
    return forma ? forma.color : "#10B981";
  };

  if (loadingDatos) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="text-center text-gray-500">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Nuevo Gasto
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
            Descripción
          </label>
          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600"
            placeholder="Ej: Compra supermercado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
            Monto
          </label>
          <input
            type="number"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            required
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600"
            placeholder="0.00"
          />
          {formData.monto && parseFloat(formData.monto) > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {formatearMonto(parseFloat(formData.monto))}
            </p>
          )}
        </div>

        {/* Categoría con botón + a la derecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
            Categoría
          </label>

          {mostrarInputNueva ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  placeholder="Nueva categoría"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={agregarNuevaCategoria}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition whitespace-nowrap dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarInputNueva(false);
                    setNuevaCategoria("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMostrarInputNueva(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center min-w-[42px] dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                title="Agregar nueva categoría"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          )}
        </div>

        {/* Forma de Pago con botón + a la derecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
            Forma de Pago
          </label>

          {mostrarInputNuevaPago ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaFormaPago}
                  onChange={(e) => setNuevaFormaPago(e.target.value)}
                  placeholder="Nueva forma de pago"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={agregarNuevaFormaPago}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition whitespace-nowrap dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarInputNuevaPago(false);
                    setNuevaFormaPago("");
                    setColorNuevaFormaPago("#10B981");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>

              {/* Selector de color para nueva forma de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Color de la forma de pago
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={colorNuevaFormaPago}
                    onChange={(e) => setColorNuevaFormaPago(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Elige un color
                  </span>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      onClick={() => setColorNuevaFormaPago(color.valor)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        colorNuevaFormaPago === color.valor
                          ? "border-gray-800 scale-110 dark:border-white"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.valor }}
                      title={color.nombre}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  name="forma_pago"
                  value={formData.forma_pago}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  style={{
                    color: getColorFormaPago(formData.forma_pago),
                    fontWeight: "500",
                  }}
                >
                  {formasPago.map((fp) => (
                    <option
                      key={fp.nombre}
                      value={fp.nombre}
                      style={{
                        color: fp.color || "#10B981",
                      }}
                    >
                      {fp.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMostrarInputNuevaPago(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center min-w-[42px] dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600"
                  title="Agregar nueva forma de pago"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>

              {/* Badge de la forma de pago seleccionada */}
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>Seleccionada:</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${getColorFormaPago(formData.forma_pago)}20`,
                    color: getColorFormaPago(formData.forma_pago),
                  }}
                >
                  💳 {formData.forma_pago}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
            Fecha
          </label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed dark:bg-gray-400 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-300 dark:disabled:cursor-not-allowed"
        >
          {loading ? "Agregando..." : "Agregar Gasto"}
        </button>
      </div>
    </form>
  );
}
