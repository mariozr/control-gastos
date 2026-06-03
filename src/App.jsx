import { useState } from "react";
import FormularioGasto from "./components/FormularioGasto";
import ListaGastos from "./components/ListaGastos";
import GraficosEstadisticos from "./components/GraficosEstadisticos";

function App() {
  const [recargarLista, setRecargarLista] = useState(0);
  const [recargarGraficos, setRecargarGraficos] = useState(0);

  const handleGastoAgregado = () => {
    // Recargar tanto la lista como los gráficos
    setRecargarLista((prev) => prev + 1);
    setRecargarGraficos((prev) => prev + 1);
  };

  const handleGastoEliminado = () => {
    // Recargar gráficos cuando se elimina un gasto
    setRecargarGraficos((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Control de Gastos
          </h1>
          <p className="text-gray-600">Para la tranquilidad de la Duilancha</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <FormularioGasto onGastoAgregado={handleGastoAgregado} />
          </div>
          <div>
            <div key={recargarGraficos}>
              <GraficosEstadisticos />
            </div>
          </div>
        </div>

        <div className="mt-6" key={recargarLista}>
          <ListaGastos onGastoEliminado={handleGastoEliminado} />
        </div>
      </div>
    </div>
  );
}

export default App;
