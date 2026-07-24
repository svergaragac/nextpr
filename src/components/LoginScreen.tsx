import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { startSession } from '../lib/session';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Completa ambos campos.');
      return;
    }

    setError(null);
    startSession(email.trim());
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dot-grid flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-cohere-hairline rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-cohere-primary" />

        <div className="flex items-center justify-center mb-8">
          <svg
            viewBox="0 0 651 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-cohere-primary fill-current h-7 w-auto block shrink-0"
            style={{ aspectRatio: '651 / 180' }}
          >
            <g clipPath="url(#clip0_login_41)">
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
              <clipPath id="clip0_login_41">
                <rect width="651" height="180" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <h1 className="text-lg font-bold text-cohere-primary tracking-tight text-center mb-1">
          Bienvenido de nuevo
        </h1>
        <p className="text-xs text-cohere-slate text-center mb-8">
          Ingresa a tu cuenta para ver tu progreso de fuerza.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-[10px] font-mono font-bold text-cohere-muted uppercase block mb-1.5">
              Correo
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-cohere-stone/35 hover:bg-cohere-stone/50 focus:bg-white text-xs border border-cohere-hairline focus:border-cohere-primary focus:ring-1 focus:ring-cohere-primary rounded-lg px-3 py-2.5 transition-all outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-[10px] font-mono font-bold text-cohere-muted uppercase block mb-1.5">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-cohere-stone/35 hover:bg-cohere-stone/50 focus:bg-white text-xs border border-cohere-hairline focus:border-cohere-primary focus:ring-1 focus:ring-cohere-primary rounded-lg px-3 py-2.5 transition-all outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full px-5 py-3 rounded-lg bg-cohere-primary hover:bg-cohere-black text-white text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Ingresar
          </button>
        </form>

        <p className="text-center text-[10px] font-mono uppercase tracking-wide text-cohere-muted mt-6">
          Modo MVP: cualquier correo y contraseña son válidos.
        </p>
      </div>
    </div>
  );
}
