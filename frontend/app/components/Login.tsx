'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface LoginProps {
  onLogin: () => void;
  toggleForm: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      onLogin();
    } catch (err) {
      const errorMsg = err instanceof AxiosError 
        ? err.response?.data?.message || err.message 
        : 'Login failed';
      setError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF9F6]">
      <div className="w-[600px] max-w-[90%] flex flex-col items-center">
        <div className="text-6xl mb-6">🌲</div>
        <h2 className="text-green-800 text-2xl font-large mb-6 text-center font-bold">
          Login to TreeGPT
        </h2>
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl p-6"
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-[#78c288] hover:bg-[#68b278] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <button onClick={toggleForm} className="text-[#78c288] hover:underline">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;