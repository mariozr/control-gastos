import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { formatearMonto } from "../utils/formatearMonto";

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

export default function FormularioGasto({ onGastoAgregado }) {
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
      alert("Por favor ingresa un nombre para la categoría");
      return;
    }

    if (
      categorias.some(
        (cat) => cat.toLowerCase() === nuevaCategoria.toLowerCase(),
      )
    ) {
      alert("Esta categoría ya existe");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("categorias")
      .insert([{ nombre: nuevaCategoria }]);

    if (error) {
      alert("Error al agregar categoría: " + error.message);
    } else {
      await cargarCategorias();
      setFormData({ ...formData, categoria: nuevaCategoria });
      setNuevaCategoria("");
      setMostrarInputNueva(false);
      alert(`Categoría "${nuevaCategoria}" agregada correctamente`);
    }
    setLoading(false);
  };

  const agregarNuevaFormaPago = async () => {
    if (nuevaFormaPago.trim() === "") {
      alert("Por favor ingresa un nombre para la forma de pago");
      return;
    }

    if (
      formasPago.some(
        (fp) => fp.nombre.toLowerCase() === nuevaFormaPago.toLowerCase(),
      )
    ) {
      alert("Esta forma de pago ya existe");
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
      alert("Error al agregar forma de pago: " + error.message);
    } else {
      await cargarFormasPago();
      setFormData({ ...formData, forma_pago: nuevaFormaPago });
      setNuevaFormaPago("");
      setColorNuevaFormaPago("#10B981");
      setMostrarInputNuevaPago(false);
      alert(`Forma de pago "${nuevaFormaPago}" agregada correctamente`);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.descripcion.trim()) {
      alert("Por favor ingresa una descripción");
      setLoading(false);
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      alert("Por favor ingresa un monto válido");
      setLoading(false);
      return;
    }

    if (!formData.categoria) {
      alert("Por favor selecciona una categoría");
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
      alert("Error al agregar gasto: " + error.message);
    } else {
      setFormData({
        descripcion: "",
        monto: "",
        categoria: formData.categoria,
        forma_pago: formData.forma_pago,
        fecha: new Date().toISOString().split("T")[0],
      });
      onGastoAgregado(data[0]);
      alert("Gasto agregado correctamente");
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
      className="bg-white p-6 rounded-lg shadow-md mb-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Nuevo Gasto</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Compra supermercado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={agregarNuevaCategoria}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition whitespace-nowrap"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarInputNueva(false);
                    setNuevaCategoria("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition flex items-center justify-center min-w-[42px]"
                title="Agregar nueva categoría"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          )}
        </div>

        {/* Forma de Pago con botón + a la derecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={agregarNuevaFormaPago}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition whitespace-nowrap"
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
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>

              {/* Selector de color para nueva forma de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color de la forma de pago
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={colorNuevaFormaPago}
                    onChange={(e) => setColorNuevaFormaPago(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Elige un color</span>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      onClick={() => setColorNuevaFormaPago(color.valor)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        colorNuevaFormaPago === color.valor
                          ? "border-gray-800 scale-110"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition flex items-center justify-center min-w-[42px]"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? "Agregando..." : "Agregar Gasto"}
        </button>
      </div>
    </form>
  );
}
