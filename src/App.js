// App.js

import React, { useEffect, useState, useRef } from 'react';
import CryptoDashboard from './components/CryptoDashboard';
import './App.css';

const App = () => {
  const [selectedCoin, setSelectedCoin] = useState('ethusdt');
  const [timeInterval, setTimeInterval] = useState('1m');
  const [coinData, setCoinData] = useState(JSON.parse(localStorage.getItem('coinData')) || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const coins = ['ethusdt', 'bnbusdt', 'dotusdt'];
  const intervals = ['1m', '3m', '5m'];

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const interval = timeInterval;
      const limit = 100;
      const endTime = Date.now();
      const startTime = endTime - limit * getIntervalMilliseconds(interval);

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${selectedCoin.toUpperCase()}&interval=${interval}&limit=${limit}&startTime=${startTime}&endTime=${endTime}`
      );

      if (!response.ok) throw new Error('Failed to fetch historical data');

      const data = await response.json();
      const formattedData = data.map((candle) => ({
        t: candle[0],
        o: parseFloat(candle[1]),
        h: parseFloat(candle[2]),
        l: parseFloat(candle[3]),
        c: parseFloat(candle[4]),
      }));

      setCoinData((prevData) => ({
        ...prevData,
        [selectedCoin]: { ...(prevData[selectedCoin] || {}), [timeInterval]: formattedData },
      }));

      localStorage.setItem(
        'coinData',
        JSON.stringify({
          ...coinData,
          [selectedCoin]: { ...(coinData[selectedCoin] || {}), [timeInterval]: formattedData },
        })
      );

      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Could not fetch historical data');
      setLoading(false);
    }
  };

  const getIntervalMilliseconds = (interval) => {
    const number = parseInt(interval.slice(0, -1));
    return number * 60 * 1000;
  };

  const connectWebSocket = () => {
    if (socketRef.current) socketRef.current.close();

    const wsUrl = `wss://stream.binance.com:9443/ws/${selectedCoin}@kline_${timeInterval}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.k.x) {
        const newCandle = {
          t: message.k.t,
          o: parseFloat(message.k.o),
          h: parseFloat(message.k.h),
          l: parseFloat(message.k.l),
          c: parseFloat(message.k.c),
        };

        setCoinData((prevData) => {
          const currentData = prevData[selectedCoin]?.[timeInterval] || [];
          const updatedData = [...currentData, newCandle].slice(-100);
          return {
            ...prevData,
            [selectedCoin]: { ...(prevData[selectedCoin] || {}), [timeInterval]: updatedData },
          };
        });
      }
    };

    socketRef.current.onerror = () => setError('WebSocket connection error');
  };

  useEffect(() => {
    fetchHistoricalData();
    connectWebSocket();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchHistoricalData, getIntervalMilliseconds(timeInterval));

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedCoin, timeInterval]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold my-6">Binance Market Data</h1>
      <div className="flex mb-4">
        {coins.map((coin) => (
          <button
            key={coin}
            className={`px-4 py-2 mx-1 rounded ${selectedCoin === coin ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            onClick={() => setSelectedCoin(coin)}
          >
            {coin.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex mb-4">
        {intervals.map((interval) => (
          <button
            key={interval}
            className={`px-4 py-2 mx-1 rounded ${timeInterval === interval ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            onClick={() => setTimeInterval(interval)}
          >
            {interval}
          </button>
        ))}
      </div>
      <CryptoDashboard data={coinData[selectedCoin]?.[timeInterval] || []} loading={loading} error={error} />
    </div>
  );
};

export default App;
