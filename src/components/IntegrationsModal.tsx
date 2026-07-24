import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Dumbbell,
  Footprints,
  Watch,
  Heart,
  Activity,
  Moon,
  Apple,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { validateHevyApiKey } from '../lib/hevyAuth';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hevyApiKey: string | null;
  onHevyConnected: (apiKey: string) => void;
  onHevyDisconnected: () => void;
}

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Dumbbell;
  functional: boolean;
}

const INTEGRATIONS: IntegrationConfig[] = [
  { id: 'hevy', name: 'Hevy', description: 'Sincroniza tus entrenamientos y marcas personales.', icon: Dumbbell, functional: true },
  { id: 'strava', name: 'Strava', description: 'Actividades de running y ciclismo.', icon: Footprints, functional: false },
  { id: 'garmin', name: 'Garmin Connect', description: 'Datos de tus dispositivos Garmin.', icon: Watch, functional: false },
  { id: 'apple_health', name: 'Apple Health', description: 'Métricas de salud desde tu iPhone.', icon: Heart, functional: false },
  { id: 'whoop', name: 'Whoop', description: 'Recuperación, tensión y sueño.', icon: Activity, functional: false },
  { id: 'oura', name: 'Oura', description: 'Sueño y recuperación desde tu anillo.', icon: Moon, functional: false },
  { id: 'myfitnesspal', name: 'MyFitnessPal', description: 'Registro de nutrición y calorías.', icon: Apple, functional: false },
];

export function IntegrationsModal({
  isOpen,
  onClose,
  hevyApiKey,
  onHevyConnected,
  onHevyDisconnected,
}: IntegrationsModalProps) {
  const [view, setView] = useState<'grid' | 'hevy'>('grid');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setView('grid');
      setApiKeyInput('');
      setStatus('idle');
      setErrorMessage(null);
    }
    if (!isOpen && successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const isHevyConnected = !!hevyApiKey;

  const handleConnect = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;

    setStatus('loading');
    setErrorMessage(null);

    const result = await validateHevyApiKey(trimmed);

    if (result.ok) {
      onHevyConnected(trimmed);
      setStatus('success');
      successTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1600);
    } else {
      setStatus('error');
      setErrorMessage(result.message);
    }
  };

  const handleDisconnect = () => {
    onHevyDisconnected();
    setView('grid');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-cohere-primary/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white border border-cohere-hairline rounded-xl overflow-hidden p-8 z-10"
          >
            <div className="absolute top-0 inset-x-0 h-[3px] bg-cohere-primary" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cohere-stone border border-cohere-hairline flex items-center justify-center text-cohere-primary">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-cohere-primary tracking-tight">Conectar aplicaciones</h3>
                  <p className="text-[10px] text-cohere-blue font-mono font-bold uppercase tracking-wider">
                    Trae tus datos reales de entrenamiento
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-cohere-muted hover:text-cohere-primary transition-colors font-sans text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <AnimatePresence mode="wait">
              {view === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {INTEGRATIONS.map((integration) => {
                    const Icon = integration.icon;
                    const isHevy = integration.id === 'hevy';
                    const connected = isHevy && isHevyConnected;

                    return (
                      <div
                        key={integration.id}
                        onClick={integration.functional ? () => setView('hevy') : undefined}
                        title={integration.functional ? undefined : 'Próximamente'}
                        className={`relative bg-white border border-cohere-hairline rounded-xl p-4 flex flex-col gap-2.5 transition-all ${
                          integration.functional
                            ? 'cursor-pointer hover:border-cohere-primary/30 hover:shadow-sm'
                            : 'opacity-50 cursor-not-allowed pointer-events-none'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-9 h-9 rounded-lg bg-cohere-stone flex items-center justify-center text-cohere-primary">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          {connected ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Conectado
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cohere-stone text-cohere-slate border border-cohere-hairline">
                              {integration.functional ? 'Conectar' : 'Próximamente'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-cohere-primary">{integration.name}</h4>
                          <p className="text-[10px] text-cohere-muted mt-0.5 leading-snug">{integration.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="hevy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    onClick={() => setView('grid')}
                    className="flex items-center gap-1 text-xs font-semibold text-cohere-slate hover:text-cohere-primary transition-colors cursor-pointer mb-5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Volver
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-cohere-stone border border-cohere-hairline flex items-center justify-center text-cohere-primary">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-cohere-primary">Hevy</h4>
                      <p className="text-[10px] text-cohere-muted">Developer API</p>
                    </div>
                  </div>

                  {status === 'success' ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center text-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                        className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4"
                      >
                        <CheckCircle2 className="w-8 h-8" />
                      </motion.div>
                      <motion.h4
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-sm font-bold text-cohere-primary mb-1"
                      >
                        ¡Hevy conectado!
                      </motion.h4>
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-xs text-cohere-muted max-w-xs"
                      >
                        Ya podés sincronizar tus entrenamientos reales. Estamos trayendo tus datos ahora mismo...
                      </motion.p>
                    </motion.div>
                  ) : isHevyConnected ? (
                    <div className="space-y-5">
                      <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-4">
                        <span className="text-[9px] font-mono tracking-wider text-cohere-muted uppercase block mb-1.5">
                          API Key conectada
                        </span>
                        <span className="text-sm font-mono font-semibold text-cohere-primary">
                          •••• {hevyApiKey!.slice(-4)}
                        </span>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-5 py-2.5 rounded-lg border border-cohere-hairline hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-cohere-slate font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-cohere-muted leading-relaxed">
                        Entra al portal de desarrolladores de Hevy en{' '}
                        <a
                          href="https://hevy.com/settings?developer"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cohere-blue hover:underline font-semibold"
                        >
                          hevy.com/settings?developer
                        </a>{' '}
                        y copia tu <code className="bg-cohere-stone border border-cohere-hairline px-1.5 py-0.5 rounded text-cohere-primary font-mono text-[11px]">API Key</code>.
                      </p>

                      <div>
                        <label htmlFor="hevy-api-key" className="text-[10px] font-mono font-bold text-cohere-muted uppercase block mb-1.5">
                          API Key
                        </label>
                        <input
                          id="hevy-api-key"
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => {
                            setApiKeyInput(e.target.value);
                            if (status === 'error') { setStatus('idle'); setErrorMessage(null); }
                          }}
                          placeholder="Pega tu API Key de Hevy"
                          className="w-full bg-cohere-stone/35 hover:bg-cohere-stone/50 focus:bg-white text-xs border border-cohere-hairline focus:border-cohere-primary focus:ring-1 focus:ring-cohere-primary rounded-lg px-3 py-2.5 transition-all outline-none"
                        />
                      </div>

                      {status === 'error' && errorMessage && (
                        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
                      )}

                      <button
                        onClick={handleConnect}
                        disabled={!apiKeyInput.trim() || status === 'loading'}
                        className="w-full px-5 py-2.5 rounded-lg bg-cohere-primary hover:bg-cohere-black disabled:opacity-50 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                        {status === 'loading' ? 'Conectando...' : 'Conectar'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
