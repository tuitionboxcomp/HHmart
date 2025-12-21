import { useState } from "react";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const correctUser = "HHmart";
  const correctPass = "@HH@mart";

  const handleLogin = () => {
    if (username === correctUser && password === correctPass) {
      localStorage.setItem("loggedIn", "true");
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">

      {/* SUBTLE BACKGROUND SHAPES */}
      <div className="absolute w-[500px] h-[500px] bg-blue-900/20 blur-[160px] rounded-full -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] bg-gray-700/20 blur-[150px] rounded-full -bottom-40 -right-40"></div>

      {/* CARD */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fadeIn">

        <h1 className="text-3xl font-extrabold text-center text-white mb-2 tracking-wide">
          HH Mart Login
        </h1>

        <p className="text-center text-gray-300 mb-6 text-sm">
          Please enter your credentials
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-3 py-2 rounded mb-4 text-sm text-center animate-shake">
            {error}
          </div>
        )}

        {/* USERNAME */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm mb-1 block">Username</label>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 backdrop-blur-sm">
            <User className="text-gray-400" />
            <input
              type="text"
              className="w-full bg-transparent text-gray-100 outline-none placeholder-gray-500"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="mb-6">
          <label className="text-gray-300 text-sm mb-1 block">Password</label>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 backdrop-blur-sm">
            <Lock className="text-gray-400" />
            <input
              type={showPass ? "text" : "password"}
              className="w-full bg-transparent text-gray-100 outline-none placeholder-gray-500"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
            <button onClick={() => setShowPass(!showPass)}>
              {showPass ? (
                <EyeOff className="text-gray-400" />
              ) : (
                <Eye className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition-all active:scale-95"
        >
          Login
        </button>

        <p className="text-center text-gray-500 text-xs mt-5 tracking-wide">
          © 2025 HH Mart Billing System
        </p>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn .5s ease-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake .3s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
