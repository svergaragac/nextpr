import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  RefreshCw,
  TrendingUp,
  Zap,
  Award,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  Key,
  ChevronRight,
  LogOut
} from 'lucide-react';

import { Exercise, LiftLog } from './types';
import {
  loadExercisesFromStorage,
  saveExercisesToStorage,
  calculateGlobalMetrics,
  calculateProgressPercentage,
  INITIAL_EXERCISES
} from './data';

import { MetricCard } from './components/MetricCard';
import { ExerciseCard } from './components/ExerciseCard';
import { TrendChart } from './components/TrendChart';
import { OtherExercisesTable } from './components/OtherExercisesTable';
import { ExerciseDetailDrawer } from './components/ExerciseDetailDrawer';
import { CoachChatbot } from './components/CoachChatbot';
import { LoginScreen } from './components/LoginScreen';
import { IntegrationsModal } from './components/IntegrationsModal';
import { hasActiveSession, endSession } from './lib/session';
import { getStoredHevyApiKey, setStoredHevyApiKey, clearStoredHevyApiKey } from './lib/hevyAuth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasActiveSession());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('squat');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Sincronizado: Hace un instante');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [hevyApiKey, setHevyApiKey] = useState<string | null>(() => getStoredHevyApiKey());

  // Ejercicio seleccionado como objetivo al abrir el modal para entrenar
  const [modalInitialExercise, setModalInitialExercise] = useState<Exercise | undefined>(undefined);

  // Inicializar cargando desde localStorage e intentar sincronizar automáticamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const loaded = loadExercisesFromStorage();
    setExercises(loaded);

    if (loaded.length > 0) {
      const exists = loaded.find(e => e.id === 'squat');
      if (!exists) {
        setSelectedExerciseId(loaded[0].id);
      }
    }

    // Intentar sincronización en segundo plano al montar la aplicación
    const autoSync = async () => {
      try {
        const headers: HeadersInit = hevyApiKey ? { 'x-hevy-api-key': hevyApiKey } : {};
        const response = await fetch("/api/sync-hevy", { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.success && !data.empty && data.exercises && data.exercises.length > 0) {
            setExercises(data.exercises);
            saveExercisesToStorage(data.exercises);

            const hasCurrentSelected = data.exercises.some((e: any) => e.id === selectedExerciseId);
            if (!hasCurrentSelected) {
              setSelectedExerciseId(data.exercises[0].id);
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setLastSyncTime(`Hevy: Hoy, ${timeStr}`);
            showToast('¡Datos de Hevy sincronizados automáticamente!', 'success');
          }
        }
      } catch (err) {
        console.warn("Autosync falló en segundo plano:", err);
      }
    };
    autoSync();
  }, [isAuthenticated]);

  // Mostrar un toast temporal
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sincronizar datos reales desde Hevy API
  const handleSyncData = async (overrideKey?: string) => {
    setIsSyncing(true);
    showToast('Conectando con la API de Hevy...', 'info');

    try {
      const keyToUse = overrideKey ?? hevyApiKey;
      const headers: HeadersInit = keyToUse ? { 'x-hevy-api-key': keyToUse } : {};
      const response = await fetch("/api/sync-hevy", { headers });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "api_key_missing") {
          setShowIntegrationsModal(true);
          showToast('No hay ninguna cuenta de Hevy conectada.', 'info');
        } else {
          showToast(`Error al sincronizar: ${data.message || 'Error desconocido'}`, 'info');
        }
        setIsSyncing(false);
        return;
      }

      if (data.empty) {
        showToast(data.message || 'No se encontraron datos.', 'info');
        setIsSyncing(false);
        return;
      }

      // Sync exitoso
      setExercises(data.exercises);
      saveExercisesToStorage(data.exercises);

      const hasCurrentSelected = data.exercises.some((e: any) => e.id === selectedExerciseId);
      if (!hasCurrentSelected) {
        setSelectedExerciseId(data.exercises[0].id);
      }
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Hevy: Hoy, ${timeStr}`);
      showToast('¡Datos de Hevy sincronizados exitosamente!', 'success');

    } catch (err: any) {
      console.error("Hevy sync fetch error:", err);
      showToast('Error de conexión con el backend de sincronización.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  // Borrar todos los datos para disparar el Estado Vacío
  const handleClearAllData = () => {
    setExercises([]);
    saveExercisesToStorage([]);
    showToast('Historial local purgado. Tu aplicación está limpia.', 'info');
  };

  // Restaurar los datos mock originales
  const handleRestoreMockData = () => {
    setExercises(INITIAL_EXERCISES);
    saveExercisesToStorage(INITIAL_EXERCISES);
    setSelectedExerciseId('squat');
    showToast('Datos de ejemplo cargados y persistidos correctamente.', 'success');
  };

  // Cerrar sesión y volver a la pantalla de login
  const handleLogout = () => {
    endSession();
    setIsAuthenticated(false);
    setIsDrawerOpen(false);
    setIsModalOpen(false);
    setShowIntegrationsModal(false);
    setToastMessage(null);
  };

  // Agregar un nuevo registro de serie de fuerza
  const handleSaveNewLog = (
    exerciseId: string,
    logDate: string,
    weight: number,
    reps: number,
    sets: number,
    estimated1RM: number
  ) => {
    const updated = exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;

      const nextWeek = ex.logs.length > 0 ? Math.max(...ex.logs.map(l => l.week)) + 1 : 1;
      const newVolume = Math.round(weight * reps * sets);

      const newLog: LiftLog = {
        week: nextWeek,
        date: logDate,
        weight,
        reps,
        sets,
        volume: newVolume
      };

      const newLogs = [...ex.logs, newLog].sort((a, b) => a.week - b.week);
      
      const isNewPB = estimated1RM > ex.current1RM;
      const updatedCurrent1RM = isNewPB ? estimated1RM : ex.current1RM;
      const updatedLastImprovementDate = isNewPB ? logDate : ex.lastImprovementDate;

      return {
        ...ex,
        current1RM: updatedCurrent1RM,
        lastImprovementDate: updatedLastImprovementDate,
        logs: newLogs
      };
    });

    setExercises(updated);
    saveExercisesToStorage(updated);

    const match = updated.find(e => e.id === exerciseId);
    if (match) {
      const isNewPB = estimated1RM > (exercises.find(e => e.id === exerciseId)?.current1RM || 0);
      if (isNewPB) {
        showToast(`¡NUEVA MARCA PERSONAL! Has establecido un 1RM de ${estimated1RM} kg en ${match.name}.`, 'success');
      } else {
        showToast(`Sesión guardada en el historial de ${match.name}. Volumen de la sesión: ${Math.round(weight*reps*sets)} kg.`, 'success');
      }
    }
  };

  // Promover un ejercicio secundario a principal
  const handlePromoteToPrimary = (exerciseId: string) => {
    const toPromote = exercises.find(e => e.id === exerciseId);
    if (!toPromote) return;

    const primaries = exercises.filter(e => e.category === 'primary');
    const targetDemoteId = primaries.find(p => p.id === selectedExerciseId)?.id || primaries[0]?.id;

    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return { ...ex, category: 'primary' as const };
      }
      if (ex.id === targetDemoteId) {
        return { ...ex, category: 'secondary' as const };
      }
      return ex;
    });

    setExercises(updated);
    saveExercisesToStorage(updated);
    setSelectedExerciseId(exerciseId);
    showToast(`Se ha promocionado ${toPromote.name} a Ejercicio Principal.`, 'success');
  };

  // Despromover un ejercicio principal a secundario
  const handleDemoteToSecondary = (exerciseId: string) => {
    const toDemote = exercises.find(e => e.id === exerciseId);
    if (!toDemote) return;

    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return { ...ex, category: 'secondary' as const };
      }
      return ex;
    });

    setExercises(updated);
    saveExercisesToStorage(updated);
    
    const firstRemainingPrimary = updated.find(e => e.category === 'primary');
    if (firstRemainingPrimary) {
      setSelectedExerciseId(firstRemainingPrimary.id);
    }
    showToast(`Se ha trasladado ${toDemote.name} al listado secundario.`, 'info');
  };

  // Abrir modal de entrenamiento para un ejercicio específico
  const handleOpenLogForExercise = (exercise: Exercise) => {
    setModalInitialExercise(exercise);
    setIsModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          if (!hevyApiKey) {
            setShowIntegrationsModal(true);
          }
        }}
      />
    );
  }

  const secondaryExercises = exercises.filter((e) => e.category === 'secondary');

  const empujeExercise = exercises.find(e => e.category === 'primary' && e.pattern === 'empuje');
  const jalonExercise = exercises.find(e => e.category === 'primary' && e.pattern === 'jalon');
  const piernaExercise = exercises.find(e => e.category === 'primary' && e.pattern === 'pierna');

  const patternsConfig = [
    { key: 'empuje', name: 'Empuje (Push)', desc: 'Pecho, Hombros, Tríceps', exercise: empujeExercise },
    { key: 'jalon', name: 'Jalón (Pull)', desc: 'Espalda, Bíceps, Antebrazos', exercise: jalonExercise },
    { key: 'pierna', name: 'Pierna (Legs)', desc: 'Cuádriceps, Femorales, Glúteos', exercise: piernaExercise },
  ];

  let selectedExercise = exercises.find((e) => e.id === selectedExerciseId);
  if (!selectedExercise && exercises.length > 0) {
    selectedExercise = exercises[0];
  }

  const globalMetrics = calculateGlobalMetrics(exercises);

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] dot-grid text-[#0a0b0d] flex flex-col font-sans selection:bg-[#0052ff]/15">
      
      {/* Simulation / Controls Bar */}
      <div className="bg-[#17171c] border-b border-cohere-hairline px-6 py-2.5 text-xs flex justify-between items-center gap-4 flex-wrap z-30 text-white">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-cohere-coral-soft rounded-full animate-pulse" />
          <span className="font-mono tracking-wide uppercase text-cohere-stone/80">MODO MVP: Simulador de Entrenamientos Integrado</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreMockData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all font-mono font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cohere-stone/75" />
            Restaurar Mocks
          </button>
          <button
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 transition-all font-mono font-semibold cursor-pointer"
            title="Probar estado vacío de la app"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar Datos (Estado Vacío)
          </button>
        </div>
      </div>

      {/* Header Panel */}
      <header className="border-b border-cohere-hairline bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg 
                viewBox="0 0 651 180" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="text-cohere-primary fill-current h-[28px] w-auto block shrink-0"
                style={{ aspectRatio: '651 / 180' }}
              >
                <g clipPath="url(#clip0_106_41)">
                  <path d="M84.5835 0.0436679C85.994 -0.0672702 87.212 -0.000910296 88.5043 0.646988C91.3304 2.06318 94.1988 3.79057 96.9406 5.36515L113.051 14.607L170.958 47.7698L170.967 115.948L170.973 132.301C170.975 135.758 171.144 139.829 170.61 143.208C170.135 146.202 165.014 148.561 162.576 149.937L154.14 154.722L124.233 171.798C123.739 172.03 123.981 172.018 123.498 171.976C123.015 171 123.314 168.112 123.305 166.9L123.292 141.513L123.29 74.8328C120.699 73.5745 116.839 71.2127 114.256 69.7401L95.606 59.0587L38 26.114L70.1185 7.79937C73.2881 6.00224 81.5343 0.894531 84.5835 0.0436679Z" fill="currentColor"/>
                  <path d="M41.9291 51.0052C45.3842 50.8649 49.0736 53.6188 52.0645 55.3497C55.6689 57.4448 59.2853 59.5189 62.9133 61.5719L104 85.2421C103.85 87.2611 103.926 89.8405 103.928 91.906L103.934 103.047L103.926 138.144C103.933 142.814 103.97 147.793 103.881 152.44C103.787 157.381 95.8295 160.364 91.7996 162.729L62.0915 179.802L61.6571 180C61.2108 179.432 61.4264 174.326 61.4262 173.176L61.4267 157.709L61.4155 109.73C40.8882 98.2682 20.5139 86.083 0 74.5279C10.7252 68.6316 21.2263 62.1355 31.8961 56.1254C34.8161 54.4805 38.7925 51.7401 41.9291 51.0052Z" fill="currentColor"/>
                  <path d="M42.7592 121C42.8201 121.081 42.8811 121.162 42.9421 121.244C43.0342 132.755 42.9935 159.971 42.9744 170C40.4071 168.348 36.6287 166.344 33.8865 164.778L15.8049 154.475L0 145.443C4.39239 142.676 10.1757 139.567 14.736 136.963L42.7592 121Z" fill="currentColor"/>
                  <path d="M583.948 138V48.4H622.86C628.492 48.4 633.399 49.3813 637.58 51.344C641.761 53.3067 645.004 56.08 647.308 59.664C649.612 63.248 650.764 67.472 650.764 72.336V73.872C650.764 79.248 649.484 83.6 646.924 86.928C644.364 90.256 641.207 92.688 637.452 94.224V96.528C640.865 96.6987 643.511 97.8933 645.388 100.112C647.265 102.245 648.204 105.104 648.204 108.688V138H631.308V111.12C631.308 109.072 630.753 107.408 629.644 106.128C628.62 104.848 626.871 104.208 624.396 104.208H600.844V138H583.948ZM600.844 88.848H621.068C625.079 88.848 628.193 87.7813 630.412 85.648C632.716 83.4293 633.868 80.528 633.868 76.944V75.664C633.868 72.08 632.759 69.2213 630.54 67.088C628.321 64.8693 625.164 63.76 621.068 63.76H600.844V88.848Z" fill="currentColor"/>
                  <path d="M506.698 138V48.4H543.562C549.194 48.4 554.143 49.552 558.41 51.856C562.762 54.0747 566.133 57.232 568.522 61.328C570.997 65.424 572.234 70.288 572.234 75.92V77.712C572.234 83.2587 570.954 88.1227 568.394 92.304C565.919 96.4 562.506 99.6 558.154 101.904C553.887 104.123 549.023 105.232 543.562 105.232H523.594V138H506.698ZM523.594 89.872H541.898C545.909 89.872 549.151 88.7627 551.626 86.544C554.101 84.3253 555.338 81.296 555.338 77.456V76.176C555.338 72.336 554.101 69.3067 551.626 67.088C549.151 64.8693 545.909 63.76 541.898 63.76H523.594V89.872Z" fill="currentColor"/>
                  <path d="M473.039 138C469.455 138 466.682 137.019 464.719 135.056C462.842 133.093 461.903 130.405 461.903 126.992V84.24H443.087V75.408H461.903V53.136H472.015V75.408H492.495V84.24H472.015V125.456C472.015 128.016 473.252 129.296 475.727 129.296H489.679V138H473.039Z" fill="currentColor"/>
                  <path d="M369.004 138L394.092 106.256L369.772 75.408H381.932L400.62 99.6H402.412L420.972 75.408H433.26L408.812 106.256L433.9 138H421.612L402.412 113.04H400.62L381.42 138H369.004Z" fill="currentColor"/>
                  <path d="M331.296 139.792C324.981 139.792 319.435 138.469 314.656 135.824C309.877 133.093 306.165 129.296 303.52 124.432C300.875 119.568 299.552 113.936 299.552 107.536V106C299.552 99.5147 300.875 93.84 303.52 88.976C306.165 84.112 309.835 80.3573 314.528 77.712C319.221 74.9813 324.597 73.616 330.656 73.616C336.544 73.616 341.749 74.896 346.272 77.456C350.795 79.9307 354.336 83.5147 356.896 88.208C359.456 92.9013 360.736 98.4053 360.736 104.72V109.328H309.664C309.92 116.069 312.096 121.36 316.192 125.2C320.288 128.955 325.408 130.832 331.552 130.832C336.928 130.832 341.067 129.595 343.968 127.12C346.869 124.645 349.088 121.701 350.624 118.288L359.328 122.512C358.048 125.157 356.256 127.803 353.952 130.448C351.733 133.093 348.789 135.312 345.12 137.104C341.536 138.896 336.928 139.792 331.296 139.792ZM309.792 101.008H350.496C350.155 95.2053 348.149 90.6827 344.48 87.44C340.896 84.1973 336.288 82.576 330.656 82.576C324.939 82.576 320.245 84.1973 316.576 87.44C312.907 90.6827 310.645 95.2053 309.792 101.008Z" fill="currentColor"/>
                  <path d="M217.24 138V48.4H238.104L269.336 131.216H271V48.4H281.624V138H260.76L229.656 55.056H227.864V138H217.24Z" fill="currentColor"/>
                </g>
                <defs>
                  <clipPath id="clip0_106_41">
                    <rect width="651" height="180" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="hidden md:block text-right">
              <span className="text-[10px] font-mono font-bold text-cohere-muted uppercase block">
                Fecha del Sistema
              </span>
              <span className="text-xs text-cohere-slate font-sans capitalize font-medium">{todayFormatted}</span>
            </div>

             <div className="flex items-center gap-2.5">
              {/* Integrations Button */}
              <button
                onClick={() => setShowIntegrationsModal(true)}
                className="p-2.5 rounded-lg border border-cohere-hairline hover:bg-cohere-stone text-cohere-slate hover:text-cohere-primary transition-all flex items-center justify-center cursor-pointer"
                title="Conectar aplicaciones"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* Sincronizar Button */}
              <button
                onClick={() => handleSyncData()}
                disabled={isSyncing}
                className="relative px-5 py-2.5 rounded-full bg-cohere-primary hover:bg-cohere-black disabled:opacity-50 text-white text-sm font-medium transition-all flex items-center gap-2 overflow-hidden cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Hevy'}
              </button>

              <div className="w-9 h-9 rounded-lg bg-cohere-stone border border-cohere-hairline flex items-center justify-center">
                <User className="w-4 h-4 text-cohere-slate" />
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-lg border border-cohere-hairline hover:bg-cohere-stone text-cohere-slate hover:text-cohere-primary transition-all flex items-center justify-center cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {exercises.length === 0 ? (
            /* ========================================== */
            /* ESTADO VACÍO                               */
            /* ========================================== */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto my-12 text-center"
            >
              <div className="bg-white border border-cohere-hairline rounded-xl p-12 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-cohere-primary" />
                
                <div className="w-16 h-16 bg-cohere-stone border border-cohere-hairline rounded-lg flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-cohere-coral" />
                </div>

                <h2 className="text-lg font-bold text-cohere-primary tracking-tight mb-3">
                  Conecta tu app de entrenamiento para comenzar
                </h2>
                
                <p className="text-cohere-slate text-xs max-w-md mx-auto leading-relaxed mb-8">
                  No se han detectado registros locales de entrenamiento ni enlaces activos. Vincula tu base de datos o carga nuestro set de entrenamiento de Hevy para ver tus proyecciones de fuerza.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleRestoreMockData}
                    className="px-6 py-3 rounded bg-cohere-primary hover:bg-cohere-black text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cohere-coral-soft" />
                    Cargar set de ejemplo (Hevy MVP)
                  </button>
                </div>
              </div>
            </motion.div>
          ) : isSyncing ? (
            /* ========================================== */
            /* ESTADO DE CARGA / SKELETONS                */
            /* ========================================== */
            <motion.div
              key="loading-skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 animate-pulse"
            >
              {/* Metrics Grid Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#dee1e6] rounded-2xl p-6 h-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    <div className="h-3 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                ))}
              </div>

              {/* Horizontal List Skeletons */}
              <div className="space-y-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#dee1e6] rounded-2xl p-6 h-40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-1/3 mt-4" />
                    <div className="h-4 bg-slate-200 rounded w-2/3 mt-3" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ========================================== */
            /* ESTADO NORMAL / DASHBOARD                  */
            /* ========================================== */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Quick Summary metrics */}
              <section>
                <div className="mb-6">
                  <span className="text-[11px] font-mono tracking-[0.08em] text-cohere-slate uppercase block mb-2">
                    Resumen · Últimas 4 semanas
                  </span>
                  <h2 className="text-3xl font-display font-normal text-cohere-primary tracking-[-0.02em]">
                    Tu mes de un vistazo
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  id="tonnage"
                  title="Total Levantado (Últimas 4 Semanas)"
                  value={globalMetrics.totalTonnageThisMonth.toLocaleString()}
                  unit="kg"
                  subtext={
                    globalMetrics.tonnageChangePercent >= 0 ? (
                      <span className="flex items-center gap-1 font-sans">
                        <span className="text-[#05b169] font-bold">▲</span>
                        <strong className="text-[#05b169] font-semibold">+{globalMetrics.tonnageChangePercent}%</strong> vs mes anterior
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-sans">
                        <span className="text-red-500 font-bold">▼</span>
                        <strong className="text-red-500 font-semibold">{globalMetrics.tonnageChangePercent}%</strong> vs mes anterior
                      </span>
                    )
                  }
                  icon={TrendingUp}
                />
                <MetricCard
                  id="streak"
                  title="Consistencia Actual"
                  value={String(globalMetrics.currentStreakDays)}
                  unit="días"
                  subtext={
                    <span>
                      Racha máxima registrada: <strong className="text-[#0a0b0d] font-mono font-semibold">{globalMetrics.bestStreakDays} días</strong>
                    </span>
                  }
                  icon={Zap}
                />
                <MetricCard
                  id="progress"
                  title="Progreso Promedio de Metas"
                  value={String(globalMetrics.averageProgressPercent)}
                  unit="%"
                  subtext="Hacia hitos de peso objetivo (1RM)"
                  icon={Award}
                />
                </div>
              </section>

              {/* Primarios Section (HORIZONTAL STACKED LIST - VAMOS CON LAS HORIZONTALES!) */}
              <div>
                <div className="flex justify-between items-baseline mb-6">
                  <div>
                    <span className="text-[11px] font-mono tracking-[0.08em] text-cohere-slate uppercase block mb-2">
                      Un ejercicio por patrón · Empuje · Jalón · Pierna
                    </span>
                    <h2 className="text-3xl font-display font-normal text-cohere-primary tracking-[-0.02em]">
                      Enfoque principal
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-cohere-muted uppercase tracking-[0.06em]">
                    Sync: <span className="text-cohere-primary">{lastSyncTime}</span>
                  </span>
                </div>

                {/* 3-Column Grid of Compact square cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {patternsConfig.map((config) => {
                    const ex = config.exercise;
                    if (ex) {
                      return (
                        <div key={config.key} className="relative group">
                          {/* Demote overlay click badge */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDemoteToSecondary(ex.id);
                            }}
                            className="absolute top-3 right-14 p-1.5 rounded bg-cohere-stone hover:bg-red-500/10 text-cohere-slate hover:text-red-600 border border-cohere-hairline opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                            title="Mover a Secundarios"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <ExerciseCard
                            exercise={ex}
                            isSelected={selectedExerciseId === ex.id}
                            onSelect={() => {
                              setSelectedExerciseId(ex.id);
                              setIsDrawerOpen(true);
                            }}
                          />
                        </div>
                      );
                    } else {
                      // Empty state for this specific movement pattern redesigned as a matching compact square card
                      return (
                        <div
                          key={config.key}
                          className="bg-cohere-stone/50 border border-dashed border-cohere-hairline rounded-lg p-6 flex flex-col justify-between h-[230px] relative overflow-hidden transition-all hover:border-cohere-primary/30"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[9px] font-mono font-bold tracking-wider bg-cohere-stone text-cohere-slate px-2.5 py-0.5 rounded border border-cohere-hairline uppercase">
                                {config.name}
                              </span>
                              <span className="text-[10px] font-mono text-cohere-muted">
                                {config.desc}
                              </span>
                            </div>
                            
                            <div className="flex items-start gap-2.5 mt-3">
                              <div className="w-8 h-8 rounded bg-cohere-stone flex items-center justify-center text-cohere-slate shrink-0 mt-0.5">
                                <Dumbbell className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-cohere-slate leading-snug">
                                  Sin datos de enfoque
                                </h3>
                                <p className="text-[11px] text-cohere-muted mt-1 leading-normal">
                                  Registra entrenamientos con peso de este patrón para proyectar con confianza.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-cohere-stone flex justify-between items-center">
                            <span className="text-[9px] font-mono font-medium text-cohere-muted uppercase">Progreso</span>
                            <span className="text-[9px] font-mono font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase tracking-wider">
                              Incompleto
                            </span>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Deep-green feature band pointing to the Drawer (Cohere signature dark band) */}
              <div className="bg-cohere-green text-white rounded-lg p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <span className="text-[11px] font-mono tracking-[0.08em] text-cohere-coral-soft uppercase block mb-3">
                    Análisis avanzado
                  </span>
                  <h3 className="text-2xl font-normal tracking-[-0.01em] leading-snug mb-2">
                    Cada ejercicio, proyectado a 2 meses.
                  </h3>
                  <p className="text-[15px] text-white/70 leading-relaxed">
                    Hacé clic en cualquier ejercicio para ver su gráfico de tendencia, proyecciones de 1RM y recomendaciones de carga.
                  </p>
                </div>
                {selectedExercise && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="shrink-0 px-6 py-3 bg-white hover:bg-cohere-stone text-cohere-primary rounded-full font-medium transition-all cursor-pointer text-sm"
                  >
                    Ver análisis de {selectedExercise.name}
                  </button>
                )}
              </div>

              {/* Secondary exercises table */}
              <section className="grid grid-cols-1 gap-6">
                <OtherExercisesTable
                  exercises={secondaryExercises}
                  onSelectExercise={(ex) => {
                    setSelectedExerciseId(ex.id);
                    setIsDrawerOpen(true);
                  }}
                  onPromoteToPrimary={handlePromoteToPrimary}
                  selectedId={selectedExerciseId}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-cohere-primary text-white border border-cohere-hairline px-5 py-4 rounded shadow-2xl max-w-md"
          >
            {toastType === 'success' ? (
              <span className="text-cohere-green font-mono font-bold">✓</span>
            ) : (
              <Clock className="w-5 h-5 text-cohere-coral shrink-0" />
            )}
            <p className="text-xs text-cohere-stone/90 leading-normal">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding and Meta */}
      <footer className="border-t border-cohere-hairline bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-cohere-muted">
          <div className="flex items-center gap-3">
            <svg 
              viewBox="0 0 651 180" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="text-cohere-primary fill-current h-6 w-auto block shrink-0"
              style={{ aspectRatio: '651 / 180' }}
            >
              <g clipPath="url(#clip0_106_41_footer)">
                <path d="M84.5835 0.0436679C85.994 -0.0672702 87.212 -0.000910296 88.5043 0.646988C91.3304 2.06318 94.1988 3.79057 96.9406 5.36515L113.051 14.607L170.958 47.7698L170.967 115.948L170.973 132.301C170.975 135.758 171.144 139.829 170.61 143.208C170.135 146.202 165.014 148.561 162.576 149.937L154.14 154.722L124.233 171.798C123.739 172.03 123.981 172.018 123.498 171.976C123.015 171 123.314 168.112 123.305 166.9L123.292 141.513L123.29 74.8328C120.699 73.5745 116.839 71.2127 114.256 69.7401L95.606 59.0587L38 26.114L70.1185 7.79937C73.2881 6.00224 81.5343 0.894531 84.5835 0.0436679Z" fill="currentColor"/>
                <path d="M41.9291 51.0052C45.3842 50.8649 49.0736 53.6188 52.0645 55.3497C55.6689 57.4448 59.2853 59.5189 62.9133 61.5719L104 85.2421C103.85 87.2611 103.926 89.8405 103.928 91.906L103.934 103.047L103.926 138.144C103.933 142.814 103.97 147.793 103.881 152.44C103.787 157.381 95.8295 160.364 91.7996 162.729L62.0915 179.802L61.6571 180C61.2108 179.432 61.4264 174.326 61.4262 173.176L61.4267 157.709L61.4155 109.73C40.8882 98.2682 20.5139 86.083 0 74.5279C10.7252 68.6316 21.2263 62.1355 31.8961 56.1254C34.8161 54.4805 38.7925 51.7401 41.9291 51.0052Z" fill="currentColor"/>
                <path d="M42.7592 121C42.8201 121.081 42.8811 121.162 42.9421 121.244C43.0342 132.755 42.9935 159.971 42.9744 170C40.4071 168.348 36.6287 166.344 33.8865 164.778L15.8049 154.475L0 145.443C4.39239 142.676 10.1757 139.567 14.736 136.963L42.7592 121Z" fill="currentColor"/>
                <path d="M583.948 138V48.4H622.86C628.492 48.4 633.399 49.3813 637.58 51.344C641.761 53.3067 645.004 56.08 647.308 59.664C649.612 63.248 650.764 67.472 650.764 72.336V73.872C650.764 79.248 649.484 83.6 646.924 86.928C644.364 90.256 641.207 92.688 637.452 94.224V96.528C640.865 96.6987 643.511 97.8933 645.388 100.112C647.265 102.245 648.204 105.104 648.204 108.688V138H631.308V111.12C631.308 109.072 630.753 107.408 629.644 106.128C628.62 104.848 626.871 104.208 624.396 104.208H600.844V138H583.948ZM600.844 88.848H621.068C625.079 88.848 628.193 87.7813 630.412 85.648C632.716 83.4293 633.868 80.528 633.868 76.944V75.664C633.868 72.08 632.759 69.2213 630.54 67.088C628.321 64.8693 625.164 63.76 621.068 63.76H600.844V88.848Z" fill="currentColor"/>
                <path d="M506.698 138V48.4H543.562C549.194 48.4 554.143 49.552 558.41 51.856C562.762 54.0747 566.133 57.232 568.522 61.328C570.997 65.424 572.234 70.288 572.234 75.92V77.712C572.234 83.2587 570.954 88.1227 568.394 92.304C565.919 96.4 562.506 99.6 558.154 101.904C553.887 104.123 549.023 105.232 543.562 105.232H523.594V138H506.698ZM523.594 89.872H541.898C545.909 89.872 549.151 88.7627 551.626 86.544C554.101 84.3253 555.338 81.296 555.338 77.456V76.176C555.338 72.336 554.101 69.3067 551.626 67.088C549.151 64.8693 545.909 63.76 541.898 63.76H523.594V89.872Z" fill="currentColor"/>
                <path d="M473.039 138C469.455 138 466.682 137.019 464.719 135.056C462.842 133.093 461.903 130.405 461.903 126.992V84.24H443.087V75.408H461.903V53.136H472.015V75.408H492.495V84.24H472.015V125.456C472.015 128.016 473.252 129.296 475.727 129.296H489.679V138H473.039Z" fill="currentColor"/>
                <path d="M369.004 138L394.092 106.256L369.772 75.408H381.932L400.62 99.6H402.412L420.972 75.408H433.26L408.812 106.256L433.9 138H421.612L402.412 113.04H400.62L381.42 138H369.004Z" fill="currentColor"/>
                <path d="M331.296 139.792C324.981 139.792 319.435 138.469 314.656 135.824C309.877 133.093 306.165 129.296 303.52 124.432C300.875 119.568 299.552 113.936 299.552 107.536V106C299.552 99.5147 300.875 93.84 303.52 88.976C306.165 84.112 309.835 80.3573 314.528 77.712C319.221 74.9813 324.597 73.616 330.656 73.616C336.544 73.616 341.749 74.896 346.272 77.456C350.795 79.9307 354.336 83.5147 356.896 88.208C359.456 92.9013 360.736 98.4053 360.736 104.72V109.328H309.664C309.92 116.069 312.096 121.36 316.192 125.2C320.288 128.955 325.408 130.832 331.552 130.832C336.928 130.832 341.067 129.595 343.968 127.12C346.869 124.645 349.088 121.701 350.624 118.288L359.328 122.512C358.048 125.157 356.256 127.803 353.952 130.448C351.733 133.093 348.789 135.312 345.12 137.104C341.536 138.896 336.928 139.792 331.296 139.792ZM309.792 101.008H350.496C350.155 95.2053 348.149 90.6827 344.48 87.44C340.896 84.1973 336.288 82.576 330.656 82.576C324.939 82.576 320.245 84.1973 316.576 87.44C312.907 90.6827 310.645 95.2053 309.792 101.008Z" fill="currentColor"/>
                <path d="M217.24 138V48.4H238.104L269.336 131.216H271V48.4H281.624V138H260.76L229.656 55.056H227.864V138H217.24Z" fill="currentColor"/>
              </g>
              <defs>
                <clipPath id="clip0_106_41_footer">
                  <rect width="651" height="180" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-[10px] text-cohere-muted font-mono">MVP v1.0.0</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase text-cohere-muted">
            <span>PROYECTADO A 2 MESES</span>
          </div>

          <p className="text-cohere-muted text-[10px] font-sans">
            Construido para levantadores de fuerza consistentes.
          </p>
        </div>
      </footer>

      {/* Exercise Detail Drawer */}
      <ExerciseDetailDrawer
        exercise={selectedExercise || null}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onPromoteToPrimary={handlePromoteToPrimary}
        onDemoteToSecondary={handleDemoteToSecondary}
      />

      {/* Modal para conectar aplicaciones (Hevy y próximas integraciones) */}
      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        hevyApiKey={hevyApiKey}
        onHevyConnected={(key) => {
          setHevyApiKey(key);
          setStoredHevyApiKey(key);
          showToast('Sincronizando tus datos de Hevy...', 'info');
          handleSyncData(key);
        }}
        onHevyDisconnected={() => {
          setHevyApiKey(null);
          clearStoredHevyApiKey();
          showToast('Hevy desconectado.', 'info');
        }}
      />

      {/* Floating AI Coach Chatbot */}
      <CoachChatbot exercises={exercises} />
    </div>
  );
}
